import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface MomentImage {
  id: string;
  src: string;
  title: string;
  player: string;
  num: number;
  tag: string;
  description: string;
  date: string;
  bgColor: string;
  accentColor: string;
  badgeText: string;
  stats?: string;
}

const PLAYER_THEMES: Record<string, { accentColor: string; bgColor: string; badgeText: string }> = {
  Hamin: {
    accentColor: '#38bdf8', // Cyber Blue
    bgColor: 'rgba(56, 189, 248, 0.15)',
    badgeText: 'LEGENDARY MVP',
  },
  '아이언크랩': {
    accentColor: '#c084fc', // Cyber Purple
    bgColor: 'rgba(168, 85, 247, 0.15)',
    badgeText: 'CLAN MVP',
  },
  Space: {
    accentColor: '#2dd4bf', // Cyber Emerald/Teal
    bgColor: 'rgba(45, 212, 191, 0.15)',
    badgeText: 'STAR PLAYER',
  },
};

const COLOR_PALETTE = [
  { accentColor: '#38bdf8', bgColor: 'rgba(56, 189, 248, 0.15)', badgeText: 'CLAN ACE' },
  { accentColor: '#c084fc', bgColor: 'rgba(168, 85, 247, 0.15)', badgeText: 'TOP MOMENT' },
  { accentColor: '#2dd4bf', bgColor: 'rgba(45, 212, 191, 0.15)', badgeText: 'HIGHLIGHT' },
  { accentColor: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', badgeText: 'EPIC MATCH' },
  { accentColor: '#f43f5e', bgColor: 'rgba(244, 63, 94, 0.15)', badgeText: 'HOT MOMENT' },
  { accentColor: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.15)', badgeText: 'VICTORY' },
];

function getPlayerTheme(playerName: string, index: number) {
  if (PLAYER_THEMES[playerName]) {
    return PLAYER_THEMES[playerName];
  }
  let hash = 0;
  for (let i = 0; i < playerName.length; i++) {
    hash = playerName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[colorIndex];
}

export async function GET() {
  try {
    const galleryDir = path.join(process.cwd(), 'public', 'assets', 'moment-gallery');
    
    if (!fs.existsSync(galleryDir)) {
      return NextResponse.json({ success: true, images: [], players: ['ALL'] });
    }

    const files = fs.readdirSync(galleryDir);
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];

    const images: MomentImage[] = [];
    const playerSet = new Set<string>();

    files.forEach((filename) => {
      // Zone.Identifier 파일이나 숨김파일 제외
      if (filename.includes(':') || filename.startsWith('.')) return;

      const ext = path.extname(filename).toLowerCase();
      if (!validExtensions.includes(ext)) return;

      const nameWithoutExt = path.basename(filename, path.extname(filename));

      // 양식: {유저이름}_{사진번호} (예: Hamin_1, Space_2, 아이언크랩_1)
      const lastUnderscore = nameWithoutExt.lastIndexOf('_');
      let playerName = nameWithoutExt;
      let photoNum = 1;

      if (lastUnderscore > 0) {
        const potentialPlayer = nameWithoutExt.substring(0, lastUnderscore);
        const potentialNum = parseInt(nameWithoutExt.substring(lastUnderscore + 1), 10);

        if (!isNaN(potentialNum)) {
          playerName = potentialPlayer;
          photoNum = potentialNum;
        }
      }

      playerSet.add(playerName);

      const theme = getPlayerTheme(playerName, playerSet.size);

      images.push({
        id: `moment_${playerName}_${photoNum}_${filename}`,
        src: `/assets/moment-gallery/${filename}`,
        title: `${playerName}: 영광의 순간 #${photoNum}`,
        player: playerName,
        num: photoNum,
        tag: '3-CROWN VICTORY',
        description: `CSE4Seoul 클랜 ${playerName} 선수의 화려한 승리 인증샷 #${photoNum}!`,
        date: '2026.08',
        bgColor: theme.bgColor,
        accentColor: theme.accentColor,
        badgeText: theme.badgeText,
        stats: 'PERFECT MATCH',
      });
    });

    // 플레이어별 사진 번호순 정렬
    images.sort((a, b) => {
      if (a.player !== b.player) {
        return a.player.localeCompare(b.player, 'ko');
      }
      return a.num - b.num;
    });

    const players = ['ALL', ...Array.from(playerSet)];

    return NextResponse.json({
      success: true,
      images,
      players,
    });
  } catch (error) {
    console.error('Failed to load moment gallery assets:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to read moment gallery' },
      { status: 500 }
    );
  }
}
