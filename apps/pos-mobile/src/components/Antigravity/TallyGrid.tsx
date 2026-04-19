import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface TallyGridProps {
  count: number;
  maxCells?: number;
  columns?: number;
  theme: any;
  themeMode: 'light' | 'dark';
  takeawayQty?: number;
}

export const TallyGrid: React.FC<TallyGridProps> = ({ 
  count, 
  maxCells = 24, 
  columns = 4, 
  theme,
  themeMode,
  takeawayQty = 0
}) => {
  const cells = Array.from({ length: maxCells }, (_, i) => i);

  return (
    <View style={styles.grid}>
      {cells.map((i) => {
        const isFilled = i < count;
        // In the simplistic version, we just color the first N as takeaway or last N?
        // Let's say takeaway items are rendered with a different color
        const isTakeaway = i < takeawayQty; 
        
        return (
          <View 
            key={i} 
            style={[
              styles.cell, 
              { 
                borderColor: themeMode === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
                width: `${100 / columns}%`
              },
              isFilled && { backgroundColor: isTakeaway ? 'rgba(255, 145, 66, 0.05)' : 'rgba(212, 132, 70, 0.05)' }
            ]}
          >
            {isFilled && (
              <Text style={[
                styles.xText, 
                { color: isTakeaway ? '#FF9142' : theme.colors.caramel }
              ]}>
                ✕
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
};

// Helper removed, using prop now

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cell: {
    aspectRatio: 1.2,
    borderWidth: 0.25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xText: {
    fontSize: 12,
    fontWeight: '900',
  }
});
