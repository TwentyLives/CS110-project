import React from "react";
import "../styles/image-viewer.css";
import { useEffect } from "react";

// SVG Icons for the arrows
const ChevronLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const ChevronRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);

function ImageViewer({ images, startIndex, onClose }) {
    const [currentIndex, setCurrentIndex] = React.useState(startIndex);

    const goToPrevious = () => {
        const isFirstImage = currentIndex === 0;
        const newIndex = isFirstImage ? images.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = () => {
        const isLastImage = currentIndex === images.length - 1;
        const newIndex = isLastImage ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    // add event listener for key presses
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "ArrowLeft") {
                goToPrevious();
            } else if (e.key === "ArrowRight") {
                goToNext();
            } else if (e.key === "Escape") {
                onClose();
            }
        };

        // add listener when the component is open
        window.addEventListener("keydown", handleKeyDown);

        // clean up that removes event listener when component is closed
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [currentIndex]); // re-run the effect if currentIndex changes to ensure latest state

    return (
        <div className="image-viewer-overlay" onClick={onClose}>
            <button className="viewer-close-button">&times;</button>

            <button
                className="viewer-arrow left"
                onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                }}
            >
                <ChevronLeftIcon />
            </button>

            <img
                src={images[currentIndex].url}
                alt="Full screen view"
                className="viewer-image"
                onClick={(e) => e.stopPropagation()} // prevents closing when clicking the image
            />

            <button
                className="viewer-arrow right"
                onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                }}
            >
                <ChevronRightIcon />
            </button>
        </div>
    );
}

export default ImageViewer;
