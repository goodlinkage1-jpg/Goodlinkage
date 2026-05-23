import React from 'react';

const GroupCard = ({ group, onClick }) => {
  // Function to display up to 3 member avatars
  const renderMemberAvatars = () => {
    const membersToShow = group.members?.slice(0, 3) || [];
    const remainingCount = (group.members?.length || 0) - membersToShow.length;
    
    return (
      <div className="flex -space-x-2">
        {membersToShow.map((member, index) => (
          <img 
            key={member._id || index} 
            src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=random`}
            alt={member.name || 'User'} 
            className="w-6 h-6 rounded-full border border-white"
          />
        ))}
        {remainingCount > 0 && (
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs border border-white">
            +{remainingCount}
          </div>
        )}
      </div>
    );
  };

  // Format the creation date to show "Created on [date]"
  const formatCreationDate = () => {
    if (!group.createdAt) return '';
    
    const date = new Date(group.createdAt);
    return `Created on ${date.toLocaleDateString()}`;
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-center mb-3">
        <img 
          src={group.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(group.name || 'Group')}&background=random`}
          alt={group.name || 'Group'} 
          className="w-12 h-12 rounded-full mr-3"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{group.name}</h3>
          <p className="text-gray-500 text-sm">{formatCreationDate()}</p>
        </div>
      </div>
      
      {group.description && (
        <p className="text-gray-600 mb-3 text-sm line-clamp-2">{group.description}</p>
      )}
      
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-gray-500 text-sm mr-2">{group.members?.length || 0} members</span>
          {renderMemberAvatars()}
        </div>
        
        {group.creator && (
          <div className="flex items-center">
            <span className="text-xs text-gray-500 mr-1">Created by</span>
            <img 
              src={group.creator.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(group.creator.name || 'User')}&background=random`}
              alt={group.creator.name || 'Creator'} 
              className="w-4 h-4 rounded-full mr-1"
            />
            <span className="text-xs font-medium truncate max-w-[80px]">{group.creator.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupCard;