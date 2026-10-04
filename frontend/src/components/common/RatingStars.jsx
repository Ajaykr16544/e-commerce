import React from 'react';
import { Star } from 'lucide-react';

const RatingStars = ({
  rating = 0,
  reviewsCount,
  size = 'w-4 h-4',
  showScore = true,
  editable = false,
  onRatingChange,
  scoreClassName = '',
  reviewsCountClassName = '',
}) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {stars.map((star) => {
          const isFilled = rating >= star;
          const isHalf = !isFilled && rating >= star - 0.5;

          return (
            <button
              type={editable ? 'button' : undefined}
              key={star}
              disabled={!editable}
              onClick={() => editable && onRatingChange && onRatingChange(star)}
              className={`${
                editable ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'
              } p-0.5 focus:outline-none`}
            >
              <Star
                className={`${size} ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : isHalf
                    ? 'fill-amber-400/50 text-amber-400'
                    : 'text-slate-300'
                }`}
              />
            </button>
          );
        })}
      </div>

      {showScore && rating > 0 && (
        <span className={`text-xs font-semibold text-slate-700 ml-0.5 ${scoreClassName}`}>
          {Number(rating).toFixed(1)}
        </span>
      )}

      {reviewsCount !== undefined && (
        <span className={`text-xs text-slate-500 ${reviewsCountClassName}`}>
          ({reviewsCount})
        </span>
      )}
    </div>
  );
};

export default RatingStars;
