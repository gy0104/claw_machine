import { useEffect, useState } from 'react';

export default function KakaoMap() {
  const [locations, setLocations] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);

  useEffect(() => {
    fetch('/locations.csv')
      .then((res) => res.text())
      .then((text) => {
        const rows = text.trim().split('\n').slice(1);
        const data = rows.map((row) => {
          const [name, address] = row.split(',');
          return { name, address };
        });
        setLocations(data);
      });
  }, []);

  useEffect(() => {
    if (!locations.length) return;
    if (document.getElementById('kakao-map-script')) return;

    const script = document.createElement('script');
    script.id = 'kakao-map-script';
    script.src =
      'https://dapi.kakao.com/v2/maps/sdk.js?appkey=de127fbb75841fde9ae8ace99d1678c7&autoload=false&libraries=services';
    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById('map');
        const map = new window.kakao.maps.Map(container, {
          center: new window.kakao.maps.LatLng(37.5665, 126.9780),
          level: 5,
        });

        const geocoder = new window.kakao.maps.services.Geocoder();

        // 현재 위치 이동
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              const userLoc = new window.kakao.maps.LatLng(lat, lng);
              map.setCenter(userLoc);

              new window.kakao.maps.Marker({
                position: userLoc,
                map: map,
                title: '내 위치',
              });
            },
            () => {
              // 실패 시 첫 장소 fallback
              geocoder.addressSearch(locations[0].address, (result, status) => {
                if (status === window.kakao.maps.services.Status.OK) {
                  const lat = result[0].y;
                  const lng = result[0].x;
                  map.setCenter(new window.kakao.maps.LatLng(lat, lng));
                }
              });
            }
          );
        }

        // 마커 생성
        locations.forEach(({ name, address }) => {
          geocoder.addressSearch(address, (result, status) => {
            if (status === window.kakao.maps.services.Status.OK) {
              const lat = result[0].y;
              const lng = result[0].x;

              const marker = new window.kakao.maps.Marker({
                position: new window.kakao.maps.LatLng(lat, lng),
                map,
              });

              const infowindow = new window.kakao.maps.InfoWindow({
                content: `
                  <div style="display: flex; align-items: center; padding: 8px; background: white; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.15); font-family: sans-serif;">
                    <img src="/claw-machine.png" width="40" height="40" style="margin-right: 8px;" />
                    <div>
                      <div style="font-weight: bold; font-size: 14px;">${name}</div>
                      <div style="font-size: 12px; color: #666;">${address}</div>
                    </div>
                  </div>
                `,
              });

              window.kakao.maps.event.addListener(marker, 'mouseover', () => {
                infowindow.open(map, marker);
              });

              window.kakao.maps.event.addListener(marker, 'mouseout', () => {
                infowindow.close();
              });

              window.kakao.maps.event.addListener(marker, 'click', () => {
                setSelectedPlace({ name, address, lat, lng });
              });
            }
          });
        });
      });
    };

    document.head.appendChild(script);
  }, [locations]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', fontFamily: 'sans-serif' }}>
      <div id="map" style={{ width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          background: 'rgba(255,255,255,0.9)',
          padding: '8px 16px',
          borderRadius: '12px',
          fontSize: '18px',
          fontWeight: '600',
          boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        }}
      >
        주석이를 위한 Claw Machine 위치 ♡
      </div>

      {selectedPlace && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            backgroundColor: 'white',
            transform: 'translateY(0)',
            transition: 'transform 0.3s ease-out',
            padding: '16px',
            zIndex: 10,
            boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ fontSize: '16px' }}>{selectedPlace.name}</strong>
            <button
              onClick={() => setSelectedPlace(null)}
              style={{
                fontSize: '18px',
                background: 'none',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>{selectedPlace.address}</div>

          <div style={{ marginTop: '12px' }}>
            <a
              href={`https://map.kakao.com/link/to/${selectedPlace.name},${selectedPlace.lat},${selectedPlace.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 16px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Kakao Navi로 길찾기
            </a>
          </div>
        </div>
      )}
    </div>
  );
}