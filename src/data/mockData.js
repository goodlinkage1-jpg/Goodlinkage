// src/data/mockData.js
export const initialPosts = [
    {
      id: 1,
      user: 'Jane Smith',
      avatar: '/api/placeholder/40/40', // Fixed placeholder image
      time: '3 hours ago',
      content: 'Just launched my new website! Check it out and let me know what you think.',
      likes: 24,
      comments: 5,
      shares: 2,
    },
    {
      id: 2,
      user: 'Mike Johnson',
      avatar: '/api/placeholder/40/40', // Fixed placeholder image
      time: '5 hours ago',
      content: 'Beautiful day for hiking! Nature always helps me clear my mind and focus on what really matters.',
      likes: 47,
      comments: 8,
      shares: 3,
    }
  ];
  
  export const suggestedConnections = [
    {
      id: 1,
      name: 'Alex Taylor',
      company: 'Apple Inc.',
      avatar: '/api/placeholder/48/48'
    },
    {
      id: 2,
      name: 'Jessica Lee',
      company: 'Microsoft',
      avatar: '/api/placeholder/48/48'
    },
    {
      id: 3,
      name: 'David Kim',
      company: 'Google',
      avatar: '/api/placeholder/48/48'
    }
  ];
  
  export const latestJobs = [
    {
      id: 1,
      title: 'Frontend Developer',
      company: 'TechCorp',
      type: 'Full-time',
      postedTime: 'Posted 2 days ago'
    },
    {
      id: 2,
      title: 'Product Manager',
      company: 'InnovateCo',
      type: 'Full-time',
      postedTime: 'Posted 3 days ago'
    },
    {
      id: 3,
      title: 'UX Designer',
      company: 'DesignHub',
      type: 'Remote',
      postedTime: 'Posted 1 week ago'
    }
  ];