import React from "react";
import noneLogo from '../assets/nonemember.png';
import silverLogo from '../assets/silvermember.png';
import goldLogo from '../assets/goldmember.png'; 
import platinumLogo from '../assets/memberplatinum.png';

const MembershipProgress = ({ totalSpent, membership }) => {
  const levels = [
    { name: "None", threshold: 0, icon: noneLogo },
    { name: "Silver", threshold: 1000000, icon: silverLogo },
    { name: "Gold", threshold: 5000000, icon: goldLogo },
    { name: "Platinum", threshold: 10000000, icon: platinumLogo },
  ];
  const currentLevelIndex = levels.findIndex((level) => level.name === membership);

  const nextLevel = currentLevelIndex < levels.length - 1 ? levels[currentLevelIndex + 1] : null;

  let progress;
  if (!nextLevel) {
    progress = 100;
  } else {
    progress = (totalSpent / nextLevel.threshold) * 100;
  }

  return (
    <div className="w-full max-w-4xl mx-auto text-gray-950">
      <div className="flex justify-between items-center mb-2">
        {levels.map((level, index) => (
          <div key={level.name} className="text-center">
            <img
              src={level.icon}
              alt={level.name}
              className={`w-10 h-10 ${
                index <= currentLevelIndex ? "opacity-100" : "opacity-50"
              }`}
            />
            <p className="text-sm">{level.name}</p>
          </div>
        ))}
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-500 h-2.5 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-2 text-center">
        {nextLevel ? (
          <p>
            {`Your spend: ${(totalSpent / 1000).toFixed(0)}k earn ${(nextLevel.threshold / 1000).toFixed(0)}k to ${nextLevel.name}`}
          </p>
        ) : (
          <p>You have reached the highest level!</p>
        )}
      </div>
    </div>
  );
};

export default MembershipProgress;