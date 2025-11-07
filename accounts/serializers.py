from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, UserStatus
from django.core.validators import FileExtensionValidator
from django.contrib.auth.password_validation import validate_password
from .utils import make_reset_token, read_reset_token
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.core.mail import send_mail

class UserSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "email", "password",
            "first_name", "last_name",
            "phone_number", "governorate", "city", "street",
            "photo",
        ]

    def create(self, validated):
        photo = validated.pop("photo", None)
        user = User.objects.create_user(**validated)
        if photo:
            user.photo = photo
            user.save(update_fields=["photo"])
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data["email"].strip().lower()
        password = data["password"]

        user = User.objects.filter(email=email).first()
        if not user or not user.check_password(password):
            # Don't leak whether email exists
            raise serializers.ValidationError({"detail": "Invalid credentials."})

        # Blocked states
        if user.status == UserStatus.BANNED:
            raise serializers.ValidationError({"detail": "Account is banned."})
        if user.status == UserStatus.SUSPENDED:
            raise serializers.ValidationError({"detail": "Account is suspended."})

        if user.status == UserStatus.DEACTIVATED:
            if user.soft_window_expired():
                user.delete()
                raise serializers.ValidationError({"detail": "Account permanently deleted."})
            user.restore()

        return user

MAX_PHOTO_MB = 3

class ProfileUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False)

    class Meta:
        model = User
        fields = [
            "email",
            "first_name", "last_name",
            "phone_number", "governorate", "city", "street",
            "photo",
        ]
        extra_kwargs = {
            "first_name": {"required": False},
            "last_name": {"required": False},
            "phone_number": {"required": False},
            "governorate": {"required": False},
            "city": {"required": False},
            "street": {"required": False},
            "photo": {"required": False},
        }

    def validate_email(self, value):
        user = self.instance
        if value and value.lower() != user.email.lower():
            if User.objects.filter(email__iexact=value).exclude(pk=user.pk).exists():
                raise serializers.ValidationError("This email is already in use.")
        return value

    def validate_photo(self, value):
        if not value:
            return value
        # size
        if value.size > MAX_PHOTO_MB * 1024 * 1024:
            raise serializers.ValidationError(f"Image too large (>{MAX_PHOTO_MB}MB).")
        # extension/content type quick check
        valid_exts = {"jpg", "jpeg", "png", "webp"}
        ext = (value.name.rsplit(".", 1)[-1].lower() if "." in value.name else "")
        if ext not in valid_exts:
            raise serializers.ValidationError("Only JPG/JPEG/PNG/WebP are allowed.")
        return value

    def update(self, instance, validated_data):
        # if email provided and changed, lower it
        email = validated_data.get("email")
        if email:
            instance.email = email.strip().lower()

        for field in ["first_name", "last_name", "phone_number", "governorate", "city", "street"]:
            if field in validated_data:
                setattr(instance, field, validated_data[field])

        if "photo" in validated_data and validated_data["photo"]:
            instance.photo = validated_data["photo"]

        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = self.context["request"].user
        if not user.check_password(data["current_password"]):
            raise serializers.ValidationError({"current_password": "Incorrect current password."})
        validate_password(data["new_password"], user=user)
        return data

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user




class MagicLinkForgotSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def save(self, *, request):
        email = self.validated_data["email"].strip().lower()
        user = User.objects.filter(email__iexact=email).first()

        if not user:
            return

        token = make_reset_token({"uid": user.pk})

        frontend_url = getattr(settings, "SITE_URL", "http://localhost:5173")
        link = f"{frontend_url}/reset-password?token={token}"

        subject = "Password Reset"
        message = f"Click the link to reset your password (valid for 30 minutes):\n{link}"
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=True)


class MagicLinkVerifySerializer(serializers.Serializer):
    token = serializers.CharField()

    def validate(self, data):
        try:
            payload = read_reset_token(data["token"])
            data["uid"] = payload.get("uid")
        except ValueError as e:
            raise serializers.ValidationError({"detail": str(e)})
        return data


class MagicLinkConfirmSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        try:
            payload = read_reset_token(data["token"])
            data["uid"] = payload.get("uid")
        except ValueError as e:
            raise serializers.ValidationError({"detail": str(e)})

        user = get_object_or_404(User, pk=data["uid"])
        validate_password(data["new_password"], user=user)
        return data

    def save(self):
        from .models import UserStatus
        uid = self.validated_data["uid"]
        user = get_object_or_404(User, pk=uid)
        user.set_password(self.validated_data["new_password"])

        if getattr(user, "status", None) == "DEACTIVATED":
            try:
                user.restore()
            except Exception:
                pass

        user.save(update_fields=["password"])
        return user
