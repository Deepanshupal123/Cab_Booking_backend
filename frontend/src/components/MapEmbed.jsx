export default function MapEmbed({ pickup, drop, point, title }) {
  if (pickup && drop) {
    const [plng, plat] = pickup;
    const [dlng, dlat] = drop;
    const src = `https://maps.google.com/maps?saddr=${plat},${plng}&daddr=${dlat},${dlng}&hl=en&z=13&output=embed`;
    return (
      <div className="map-wrap">
        {title && <p className="muted">{title}</p>}
        <iframe title="route-map" src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </div>
    );
  }
  if (point) {
    const [lng, lat] = point;
    const src = `https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed`;
    return (
      <div className="map-wrap">
        {title && <p className="muted">{title}</p>}
        <iframe title="area-map" src={src} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      </div>
    );
  }
  return null;
}
