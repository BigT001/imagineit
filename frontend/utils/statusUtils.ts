export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    case 'initializing':
      return 'bg-blue-100 text-blue-800';
    case 'generating_script':
      return 'bg-purple-100 text-purple-800';
    case 'generating_assets':
      return 'bg-indigo-100 text-indigo-800';
    case 'creating_animation':
      return 'bg-yellow-100 text-yellow-800';
    case 'generating_audio':
      return 'bg-orange-100 text-orange-800';
    case 'animation_created':
      return 'bg-teal-100 text-teal-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
