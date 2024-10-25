'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import {
  BarChart2,
  TrendingUp,
  PlusCircle,
  Lock,
  GripHorizontal,
  User,
} from 'lucide-react';
import SelectedDriverCard from '@/components/live/SelectedDriverCard';
import UserBetsWidget from '@/components/live/UserBetsWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

const defaultLayouts = {
  "lg": [
      {
          "w": 8,
          "h": 10,
          "x": 4,
          "y": 0,
          "i": "driver",
          "moved": false,
          "static": false
      },
      {
          "w": 4,
          "h": 10,
          "x": 0,
          "y": 0,
          "i": "userBets",
          "moved": false,
          "static": false
      },
      {
          "w": 8,
          "h": 8,
          "x": 4,
          "y": 10,
          "i": "dashboard",
          "moved": false,
          "static": false
      },
      {
          "w": 4,
          "h": 8,
          "x": 0,
          "y": 10,
          "i": "betting",
          "moved": false,
          "static": false
      },
      {
          "w": 4,
          "h": 6,
          "x": 0,
          "y": 18,
          "i": "createWidget",
          "moved": false,
          "static": false
      }
  ],
  "md": [
      {
          "w": 6,
          "h": 11,
          "x": 6,
          "y": 0,
          "i": "driver",
          "moved": false,
          "static": false
      },
      {
          "w": 6,
          "h": 11,
          "x": 0,
          "y": 0,
          "i": "userBets",
          "moved": false,
          "static": false
      },
      {
          "w": 6,
          "h": 7,
          "x": 6,
          "y": 11,
          "i": "dashboard",
          "moved": false,
          "static": false
      },
      {
          "w": 6,
          "h": 7,
          "x": 0,
          "y": 11,
          "i": "betting",
          "moved": false,
          "static": false
      },
      {
          "w": 6,
          "h": 5,
          "x": 0,
          "y": 18,
          "i": "createWidget",
          "moved": false,
          "static": false
      }
  ],
  "sm": [
      {
          "w": 6,
          "h": 8,
          "x": 0,
          "y": 0,
          "i": "driver",
          "moved": false,
          "static": false
      },
      {
          "w": 6,
          "h": 10,
          "x": 0,
          "y": 17,
          "i": "userBets",
          "moved": false,
          "static": false
      },
      {
          "w": 6,
          "h": 5,
          "x": 0,
          "y": 12,
          "i": "dashboard",
          "moved": false,
          "static": false
      },
      {
          "w": 6,
          "h": 4,
          "x": 0,
          "y": 8,
          "i": "betting",
          "moved": false,
          "static": false
      },
      {
          "w": 6,
          "h": 2,
          "x": 0,
          "y": 27,
          "i": "createWidget",
          "moved": false,
          "static": false
      }
  ]
};

export default function DraggableWidgets({
  selectedDriver,
  drivers,
  setSelectedDriver,
  raceData,
  isRaceFinished,
  setShowFinalDashboard,
}) {
  const [layouts, setLayouts] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedLayouts = localStorage.getItem('dashboardLayouts');
      return savedLayouts ? JSON.parse(savedLayouts) : defaultLayouts;
    }
    return defaultLayouts;
  });

  const onLayoutChange = (currentLayout, allLayouts) => {
    setLayouts(allLayouts);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboardLayouts', JSON.stringify(allLayouts));
    }
  };

  const WidgetHeader = ({ icon, title }) => (
    <div
      className="cursor-move flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-800"
      data-grid-drag-handle
    >
      <h3 className="flex items-center space-x-2 text-primary text-sm font-semibold">
        {icon}
        <span>{title}</span>
      </h3>
      <GripHorizontal className="w-4 h-4 text-gray-400" />
    </div>
  );

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={{ lg: 1200, md: 996, sm: 768 }}
      cols={{ lg: 12, md: 12, sm: 6 }}
      rowHeight={30}
      onLayoutChange={onLayoutChange}
      isDraggable
      isResizable
      margin={[16, 16]}
      containerPadding={[16, 16]}
      preventCollision={false}
      compactType="vertical"
      draggableHandle=".cursor-move"
    >
      <div
        key="driver"
        className="widget-container bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden"
      >
        <WidgetHeader icon={<User className="w-4 h-4" />} title="Selected Driver" />
        <div className="overflow-auto h-full">
          <SelectedDriverCard
            selectedDriver={selectedDriver}
            drivers={drivers}
            setSelectedDriver={setSelectedDriver}
            raceData={raceData}
          />
        </div>
      </div>
      <div
        key="userBets"
        className="widget-container bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden"
      >
        <WidgetHeader icon={<BarChart2 className="w-4 h-4" />} title="Your Bets" />
        <div className="overflow-auto h-full">
          <UserBetsWidget isRaceFinished={isRaceFinished} />
        </div>
      </div>
      <div
        key="dashboard"
        className="widget-container bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden"
      >
        <WidgetHeader icon={<BarChart2 className="w-4 h-4" />} title="Race Dashboard" />
        <div
          className="flex items-center justify-center h-full cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          onClick={() => setShowFinalDashboard(true)}
        >
          View detailed race statistics and lap times
        </div>
      </div>
      <div
        key="betting"
        className="widget-container bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden"
      >
        <WidgetHeader icon={<TrendingUp className="w-4 h-4" />} title="Bet Trendings" />
        <div className="flex items-center justify-center h-full cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          See popular bets and trending drivers
        </div>
      </div>
      <div
        key="createWidget"
        className="widget-container bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
      >
        <WidgetHeader icon={<PlusCircle className="w-4 h-4" />} title="Create Widget" />
        <div className="flex items-center justify-center h-full text-gray-500">
          <Lock className="w-4 h-4 mr-2" />
          Coming soon: Create custom widgets
        </div>
      </div>
    </ResponsiveGridLayout>
  );
}

