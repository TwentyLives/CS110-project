import React, {useState, useEffect} from 'react';
import { useInRouterContext, useNavigate } from 'react-router'; 
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/home-styles.css';

// svg icons for scrolling images
const ChevronLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" style={{height: '2rem', width: '2rem', color: 'white'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" style={{height: '2rem', width: '2rem', color: 'white'}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);

// mock data to test
const mockFeedItems = [
    { 
        id: 1, 
        user: { name: 'Alice', avatarUrl: 'https://placehold.co/100x100/3498db/ffffff?text=A' },
        albumTitle: 'Summer Vacation at the Beach',
        images: [
        'https://placehold.co/600x600/3498db/ffffff?text=Beach+1',
        'https://placehold.co/600x600/3498db/ffffff?text=Beach+2',
        'https://placehold.co/600x800/3498db/ffffff?text=Beach+3',
        ],
        timestamp: '2 hours ago',
        likes: 124,
    },
    { 
        id: 2, 
        user: { name: 'Bob', avatarUrl: 'https://placehold.co/100x100/2ecc71/ffffff?text=B' },
        albumTitle: 'Weekend Hiking Trip',
        images: [
        'https://placehold.co/600x600/2ecc71/ffffff?text=Hike+1',
        'https://placehold.co/600x600/2ecc71/ffffff?text=Hike+2',
        ],
        timestamp: '1 day ago',
        likes: 88,
    },
        { 
        id: 3, 
        user: { name: 'Charlie', avatarUrl: 'https://placehold.co/100x100/e74c3c/ffffff?text=C' },
        albumTitle: 'Single Photo: City Sunset',
        images: [
        'https://placehold.co/600x600/e74c3c/ffffff?text=Sunset',
        ],
        timestamp: '3 days ago',
        likes: 215,
    },
];

// post card component to be reused
const PostCard = ({ post }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const goToPrevious = () => {
        if (currentImageIndex > 0) {
            setCurrentImageIndex(currentImageIndex - 1);
        }
    };

    const goToNext = () => {
        if (currentImageIndex < post.images.length - 1) {
            setCurrentImageIndex(currentImageIndex + 1);
        }
    };

    return(
        <div className='post-card'>
            <div className='post-header'>
                <img src={post.user.avatarUrl} alt={post.user.name} className='post-avatar'/>
                <div>
                    <p className='post-user-name'>{post.user.name}</p>
                    <p className='post-timestamp'>{post.timestamp}</p>
                </div>
            </div>

            <div className='image-slider'>
                <div className='image-container'>
                    <img 
                        src={post.images[currentImageIndex]} 
                        alt={post.albumTitle}
                        className='slider-image'
                    />
                </div>

                {/* show chevron to go back in images */}
                {currentImageIndex > 0 && (
                    <button onClick={goToPrevious} className='slider-arrow-left'>
                        <ChevronLeftIcon/>
                    </button>
                )}

                {/* show chevron to go forward in images */}
                {currentImageIndex < post.images.length - 1 && (
                    <button onClick={goToNext} className='slider-arrow-right'>
                        <ChevronRightIcon/>
                    </button>
                )}

                {/* show slider dots at bottom and determine which one to shade in */}
                {post.images.length > 1 && (
                    <div className='slider-dots'>
                        {post.images.map((_, index) => (
                            <div
                                key={index}
                                className={`dot ${currentImageIndex === index ? 'active' : 'inactive'}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            <div className='post-info'>
                <p className="post-likes">{post.likes} likes</p>
                <p className='post-description'>
                    <span style={{fontWeight: '700'}}>{post.user.name}</span> {post.albumTitle}
                </p>
            </div>
        </div>
    );
};

function Home(){
    const navigate = useNavigate();

    const[feedItems, setFeedItems] = useState([]);

    useEffect(() => {
        // need to set up connection to backend to retrieve feed items
        setFeedItems(mockFeedItems); 
    }, []);

    return(
        <div className='app-container'>
            <Header/>
                <main className='main-feed'>
                    <div className='feed-content'>
                        {feedItems.map(item=> (
                            <PostCard key={item.id} post={item}/>
                        ))}
                    </div>
                </main>
            <Footer/>
        </div>
    );
}

export default Home;