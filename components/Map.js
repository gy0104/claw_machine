import { useEffect, useRef, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function KakaoMap() {
  const mapRef = useRef(null);
  const geocoderRef = useRef(null);
  const [searchInput, setSearchInput] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [locations, setLocations] = useState([]);
  const [reviewInput, setReviewInput] = useState('');
  const [storedReview, setStoredReview] = useState('');

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
  
    const ps = new window.kakao.maps.services.Places();
  
    ps.keywordSearch(searchInput, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const { y, x } = data[0];
        const center = new window.kakao.maps.LatLng(y, x);
        mapRef.current.setLevel(4);
        mapRef.current.setCenter(center);
      } else {
        alert('검색 결과가 없습니다.');
      }
    });
  };

  const loadReview = async (storeId) => {
    const docRef = doc(db, 'reviews', storeId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      setStoredReview(snap.data().text);
    } else {
      setStoredReview('');
    }
  };

  const saveReview = async (storeId) => {
    const docRef = doc(db, 'reviews', storeId);
    await setDoc(docRef, { text: reviewInput });
    setStoredReview(reviewInput);
    setReviewInput('');
  };

  useEffect(() => {
    fetch('/locations.csv')
      .then((res) => res.text())
      .then((text) => {
        const rows = text.trim().split('\n').slice(1);
        const data = rows.map((row) => {
          const [store_id, name, address] = row.split(',');
          return { store_id, name, address };
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

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const loc = new window.kakao.maps.LatLng(lat, lng);
            map.setCenter(loc);

            const image = new window.kakao.maps.MarkerImage(
              '/icons/location-pin.png',
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

        locations.forEach(({ store_id, name, address }) => {
          geocoderRef.current.addressSearch(address, (result, status) => {
            if (status === window.kakao.maps.services.Status.OK) {
              const lat = result[0].y;
              const lng = result[0].x;
              const marker = new window.kakao.maps.Marker({
                map,
                position: new window.kakao.maps.LatLng(lat, lng),
              });

              const infowindow = new window.kakao.maps.InfoWindow({
                content: `<div style="padding:6px;font-size:13px;"><strong>${name}</strong><br/>${address}</div>`,
              });

              window.kakao.maps.event.addListener(marker, 'mouseover', () => {
                infowindow.open(map, marker);
              });
              window.kakao.maps.event.addListener(marker, 'mouseout', () => {
                infowindow.close();
              });
              window.kakao.maps.event.addListener(marker, 'click', () => {
                setSelectedPlace({ store_id, name, address, lat, lng });
                loadReview(store_id);
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

      {/* 🔍 검색창 */}
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
        }}>
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

      {/* 📍 내 위치 이동 버튼 */}
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
        }}>
        <img src="/icons/locate-me.png" width="24" height="24" />
      </div>

      {/* 🪟 팝업 카드 */}
      {selectedPlace && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            zIndex: 100,
            minWidth: '280px',
            maxWidth: '90%',
          }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>{selectedPlace.name}</strong>
            <button
              onClick={() => setSelectedPlace(null)}
              style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>
              ×
            </button>
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#555' }}>{selectedPlace.address}</div>
          <div style={{ marginTop: '12px' }}>
            <a
              href={`https://map.kakao.com/link/to/${selectedPlace.name},${selectedPlace.lat},${selectedPlace.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '8px 12px',
                background: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                display: 'inline-block',
              }}>
              길찾기
            </a>
          </div>

          {/* ✍️ 리뷰 입력 & 표시 */}
          <div style={{ marginTop: '16px' }}>
            <textarea
              value={reviewInput}
              onChange={(e) => setReviewInput(e.target.value)}
              placeholder="리뷰를 남겨보세요"
              style={{ width: '100%', padding: '8px', fontSize: '14px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            <button onClick={() => saveReview(selectedPlace.store_id)} style={{
              marginTop: '8px',
              padding: '6px 12px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}>
              리뷰 등록
            </button>
          </div>

          {storedReview && (
            <div style={{ marginTop: '12px', fontSize: '14px', color: '#444' }}>
              📌 <strong>리뷰:</strong> {storedReview}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
