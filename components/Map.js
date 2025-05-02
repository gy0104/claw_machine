import { useEffect, useState, useRef } from 'react';

export default function KakaoMap() {
  const [locations, setLocations] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const mapRef = useRef(null); // 지도 객체 저장용
  const geocoderRef = useRef(null); // 지오코더 저장용

  const goToMyLocation = () => {
    if (!navigator.geolocation || !mapRef.current) return;

    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const coord = new window.kakao.maps.LatLng(lat, lng);
      mapRef.current.setCenter(coord);
    });
  };

  const handleSearch = () => {
    if (!searchInput || !geocoderRef.current || !mapRef.current) return;

    geocoderRef.current.addressSearch(searchInput, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const lat = result[0].y;
        const lng = result[0].x;
        const coord = new window.kakao.maps.LatLng(lat, lng);
        mapRef.current.setCenter(coord);
      } else {
        alert('주소를 찾을 수 없습니다.');
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
        mapRef.current = map;
        geocoderRef.current = new window.kakao.maps.services.Geocoder();

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              const userLoc = new window.kakao.maps.LatLng(lat, lng);
              map.setCenter(userLoc);

              const markerImage = new window.kakao.maps.MarkerImage(
                '/icons/red-marker.png',
                new window.kakao.maps.Size(40, 40),
                { offset: new window.kakao.maps.Point(20, 40) }
              );

              new window.kakao.maps.Marker({
                position: userLoc,
                map: map,
                title: '내 위치',
                image: markerImage,
              });
            },
            () => {
              geocoderRef.current.addressSearch(locations[0].address, (result, status) => {
                if (status === window.kakao.maps.services.Status.OK) {
                  const lat = result[0].y;
                  const lng = result[0].x;
                  map.setCenter(new window.kakao.maps.LatLng(lat, lng));
                }
              });
            }
          );
        }

        locations.forEach(({ name, address }) => {
          geocoderRef.current.addressSearch(address, (result, status) => {
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
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div id="map" style={{ width: '100%', height: '100%' }} />

      {/* 상단 검색창 */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          background: 'white',
          borderRadius: '12px',
          padding: '8px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <input
          type="text"
          placeholder="장소 검색"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{
            height: '32px',
            padding: '0 10px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            fontSize: '14px',
            minWidth: '200px',
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            background: '#007bff',
            color: 'white',
            fontSize: '14px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          검색
        </button>
      </div>

      {/* 내 위치 이동 버튼 */}
      <div
        onClick={goToMyLocation}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          cursor: 'pointer',
        }}
      >
        <img src="/icons/locate-me.png" alt="내 위치" width="24" height="24" />
      </div>

      {/* 선택된 장소 정보 카드 */}
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