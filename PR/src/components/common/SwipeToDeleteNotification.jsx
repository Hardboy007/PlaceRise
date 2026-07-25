import React, { useState, useRef } from "react";
import { X, Trash2 } from "lucide-react";

export default function SwipeToDeleteNotification({
  notification: n,
  onClick,
  onDelete,
}) {
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  
  const SWIPE_THRESHOLD = -80; // How far to swipe left before showing delete

  const handleTouchStart = (e) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = startXRef.current;
    setIsSwiping(true);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    currentXRef.current = e.touches[0].clientX;
    const diffX = currentXRef.current - startXRef.current;
    
    // Only allow swiping left
    if (diffX < 0) {
      setTranslateX(diffX);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (translateX < SWIPE_THRESHOLD) {
      // Swiped enough to trigger delete or show delete button
      setTranslateX(-80); // Lock it to show the delete button underneath
    } else {
      // Snap back
      setTranslateX(0);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(e, n._id);
  };

  const handleClick = (e) => {
    if (translateX < 0) {
      // If it's swiped, clicking anywhere snaps it back
      setTranslateX(0);
      e.stopPropagation();
    } else {
      onClick(n);
    }
  };

  return (
    <div className="relative overflow-hidden group">
      {/* Background Delete Button (shows when swiped left) */}
      <div className="absolute inset-y-0 right-0 w-20 bg-[#EF4444] flex flex-col items-center justify-center text-white cursor-pointer"
           onClick={handleDelete}>
        <Trash2 size={20} />
        <span className="text-[10px] font-medium mt-1">Delete</span>
      </div>

      {/* Foreground Notification Content */}
      <div
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`px-4 py-3 border-b border-[#F8FAFC] cursor-pointer relative transition-transform ${
          !isSwiping ? "duration-300 ease-out" : "duration-0"
        } bg-white ${!n.isRead ? "bg-blue-50/50 border-l-2 border-l-[#3B82F6]" : ""}`}
        style={{ transform: `translateX(${translateX}px)` }}
      >
        <p className="text-sm font-semibold text-[#1E293B] pr-6">
          {n.title}
        </p>
        
        {/* Desktop hover delete button */}
        <button
          onClick={handleDelete}
          className="absolute right-4 top-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#64748B] hover:text-[#EF4444] rounded-full hover:bg-red-50 hidden md:block"
          title="Delete notification"
        >
          <X size={14} />
        </button>

        <p className="text-xs text-[#64748B] mt-0.5 pr-6">{n.message}</p>
        <p className="text-xs text-[#94A3B8] mt-1">
          {new Date(n.createdAt).toLocaleString("en-IN")}
        </p>
      </div>
    </div>
  );
}
