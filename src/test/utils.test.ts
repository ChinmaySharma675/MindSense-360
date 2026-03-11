import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility function', () => {
  it('should merge class names', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base', isActive && 'active');
    expect(result).toBe('base active');
  });

  it('should filter out falsy values', () => {
    const result = cn('base', false, null, undefined, 'valid');
    expect(result).toBe('base valid');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should merge Tailwind classes correctly', () => {
    // tailwind-merge should handle conflicting classes
    const result = cn('p-2', 'p-4');
    expect(result).toBe('p-4'); // Later class should win
  });

  it('should handle array inputs', () => {
    const result = cn(['class1', 'class2']);
    expect(result).toBe('class1 class2');
  });

  it('should handle object notation', () => {
    const result = cn({
      'class1': true,
      'class2': false,
      'class3': true,
    });
    expect(result).toBe('class1 class3');
  });
});

describe('Risk level utilities', () => {
  function getRiskColor(level: 'LOW' | 'MEDIUM' | 'HIGH'): string {
    const colors = {
      LOW: 'text-success',
      MEDIUM: 'text-warning',
      HIGH: 'text-destructive',
    };
    return colors[level];
  }

  function getRiskEmoji(level: 'LOW' | 'MEDIUM' | 'HIGH'): string {
    const emojis = {
      LOW: '✅',
      MEDIUM: '⚠️',
      HIGH: '🚨',
    };
    return emojis[level];
  }

  it('should return correct colors for risk levels', () => {
    expect(getRiskColor('LOW')).toBe('text-success');
    expect(getRiskColor('MEDIUM')).toBe('text-warning');
    expect(getRiskColor('HIGH')).toBe('text-destructive');
  });

  it('should return correct emojis for risk levels', () => {
    expect(getRiskEmoji('LOW')).toBe('✅');
    expect(getRiskEmoji('MEDIUM')).toBe('⚠️');
    expect(getRiskEmoji('HIGH')).toBe('🚨');
  });
});

describe('Score formatting', () => {
  function formatScore(score: number | null): string {
    if (score === null) return 'N/A';
    return `${Math.round(score * 100)}%`;
  }

  function formatScoreDecimal(score: number | null): string {
    if (score === null) return '--';
    return score.toFixed(2);
  }

  it('should format score as percentage', () => {
    expect(formatScore(0.75)).toBe('75%');
    expect(formatScore(0.5)).toBe('50%');
    expect(formatScore(1)).toBe('100%');
    expect(formatScore(0)).toBe('0%');
  });

  it('should handle null scores', () => {
    expect(formatScore(null)).toBe('N/A');
    expect(formatScoreDecimal(null)).toBe('--');
  });

  it('should format score as decimal', () => {
    expect(formatScoreDecimal(0.756)).toBe('0.76');
    expect(formatScoreDecimal(0.5)).toBe('0.50');
  });
});

describe('Date utilities', () => {
  function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  it('should format recent time as just now', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('Just now');
  });

  it('should format minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000);
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago');
  });

  it('should format hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60000);
    expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago');
  });

  it('should format days ago', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60000);
    expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
  });
});
