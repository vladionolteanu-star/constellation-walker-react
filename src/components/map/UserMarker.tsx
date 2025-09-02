import React from 'react';

interface UserMarkerProps {
  user: {
    id: string;
    name: string;
    isBot?: boolean;
    isCurrentUser?: boolean;
  };
}

const UserMarker: React.FC<UserMarkerProps> = ({ user }) => {
  // Marker-ele sunt create direct în MapContainer
  return null;
};

export default UserMarker;
