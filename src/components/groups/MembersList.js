import React from 'react';

const MembersList = ({ members, creator, currentUserId, onRemoveMember }) => {
  // Function to check if a user is the creator
  const isCreator = (userId) => {
    return userId === creator?._id;
  };
  
  // Function to check if current user can remove a member
  const canRemoveMember = (memberId) => {
    // Creator can remove anyone except themselves
    if (currentUserId === creator?._id) {
      return memberId !== currentUserId;
    }
    
    // Non-creators can only remove themselves (leave the group)
    return memberId === currentUserId;
  };

  return (
    <div className="space-y-3">
      {members.map(member => (
        <div key={member._id} className="flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
              alt={member.name} 
              className="w-8 h-8 rounded-full mr-2"
            />
            <div>
              <div className="flex items-center">
                <span className="font-medium">{member.name}</span>
                {isCreator(member._id) && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                    Admin
                  </span>
                )}
                {member._id === currentUserId && (
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs">
                    You
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-xs">{member.email}</p>
            </div>
          </div>
          
          {canRemoveMember(member._id) && (
            <button 
              className="text-xs text-red-500 hover:text-red-700"
              onClick={() => onRemoveMember(member._id)}
            >
              {member._id === currentUserId ? 'Leave' : 'Remove'}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default MembersList;