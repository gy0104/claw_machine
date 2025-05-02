import { useEffect, useRef, useState } from 'react';

export default function KakaoMap() {
  const mapRef = useRef(null);
  const geocoderRef = useRef(null);
  const [searchInput, setSearchInput] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [locations, setLocations] = useState([]);

  const goToMyLocation = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const loc = new window.kakao.maps.LatLng(lat, lng);
      mapRef.current.setCenter(loc);
    });
  };

  const handleSearch = () => {
    if (!searchInput || !geocoderRef.current || !mapRef.current) return;
    geocoderRef.current.addressSearch(searchInput, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const lat = result[0].y;
        const lng = result[0].x;
        mapRef.current.setCenter(new window.kakao.maps.LatLng(lat, lng));
      } else {
        alert('주소를 찾을 수 없습니다');
      }
    });
  };

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

    const script = document.createElement('script');
    script.src =
      'https://dapi.kakao.com/v2/maps/sdk.js?appkey=de127fbb75841fde9ae8ace99d1678c7&autoload=false&libraries=services';
    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById('map');
        const map = new window.kakao.maps.Map(container, {
          center: new window.kakao.maps.LatLng(37.5665, 126.9780),
          level: 5,
        });

        mapRef.current = map;
        geocoderRef.current = new window.kakao.maps.services.Geocoder();

        // 내 위치 마커
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const loc = new window.kakao.maps.LatLng(lat, lng);
            map.setCenter(loc);

            const image = new window.kakao.maps.MarkerImage(
              '/icons/pin.png',
              new window.kakao.maps.Size(40, 40),
              { offset: new window.kakao.maps.Point(20, 40) }
            );

            new window.kakao.maps.Marker({
              map,
              position: loc,
              image,
              title: '내 위치',
            });
          },
          () => {
            console.log('위치 접근 실패');
          }
        );

        // 데이터 마커
        locations.forEach(({ name, address }) => {
          geocoderRef.current.addressSearch(address, (result, status) => {
            if (status === window.kakao.maps.services.Status.OK) {
              const lat = result[0].y;
              const lng = result[0].x;
              const marker = new window.kakao.maps.Marker({
                map,
                position: new window.kakao.maps.LatLng(lat, lng),
              });

              const infowindow = new window.kakao.maps.InfoWindow({
                content: `
                  <div style="padding:6px;font-size:13px;">
                    <strong>${name}</strong><br/>${address}
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
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div id="map" style={{ width: '100%', height: '100%' }} />

      {/* 검색창 */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          background: 'white',
          padding: '8px',
          borderRadius: '12px',
          display: 'flex',
          gap: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}
      >
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="장소 검색"
          style={{ border: '1px solid #ccc', borderRadius: '6px', padding: '4px 8px' }}
        />
        <button onClick={handleSearch} style={{ padding: '4px 12px', borderRadius: '6px', background: '#007bff', color: 'white', border: 'none' }}>
          검색
        </button>
      </div>

      {/* 내 위치 버튼 */}
      <div
        onClick={goToMyLocation}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          width: 48,
          height: 48,
          background: 'white',
          borderRadius: '50%',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          zIndex: 10,
        }}
      >
        <img src="/icons/locate-me.png" width="24" height="24" />
      </div>

      {/* 장소 카드 */}
      {selectedPlace && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            background: '#fff',
            padding: '16px',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
            zIndex: 10,
          }}
        >
          <strong>{selectedPlace.name}</strong>
          <p>{selectedPlace.address}</p>
          <a
            href={`https://map.kakao.com/link/to/${selectedPlace.name},${selectedPlace.lat},${selectedPlace.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#007bff' }}
          >
            길찾기
          </a>
        </div>
      )}
    </div>
  );
}