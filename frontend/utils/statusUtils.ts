export const getStatusColor = (status: string): string => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'script_generated': return 'bg-blue-100 text-blue-800';
      case 'assets_generated': return 'bg-purple-100 text-purple-800';
      case 'animation_created': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  