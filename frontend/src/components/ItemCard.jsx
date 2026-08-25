import { Link } from 'react-router-dom'
import { formatDate } from '../api'

const tilts = ['-1.1deg', '0.8deg', '-0.6deg', '1.2deg', '-0.9deg', '0.7deg']

export default function ItemCard({ item, index = 0 }) {
  const reunited = !!item.final_found_time
  const tilt = tilts[index % tilts.length]
  const cat = item.category?.category_name

  return (
    <Link to={`/items/${item.id}`} className={`notice ${reunited ? 'is-reunited' : ''}`} style={{ '--tilt': tilt }}>
      <span className="pin" aria-hidden="true" />
      {reunited && <span className="stamp stamp-mint">Reunited</span>}
      {cat && <span className="tag">{cat}</span>}
      <h3 className="notice-title">{item.item_name}</h3>
      {item.main_photo_url ? (
        <img className="notice-photo" src={item.main_photo_url} alt={item.item_name} loading="lazy" />
      ) : (
        <div className="notice-photo notice-photo-empty" aria-hidden="true">
          no photo
        </div>
      )}
      {item.description && <p className="notice-desc">{item.description}</p>}
      <dl className="notice-meta">
        {item.color && (
          <div>
            <dt>Color</dt>
            <dd>{item.color}</dd>
          </div>
        )}
        {item.unique_marks && (
          <div>
            <dt>Marks</dt>
            <dd>{item.unique_marks}</dd>
          </div>
        )}
        <div>
          <dt>Reported</dt>
          <dd>{formatDate(item.created_at)}</dd>
        </div>
      </dl>
    </Link>
  )
}
