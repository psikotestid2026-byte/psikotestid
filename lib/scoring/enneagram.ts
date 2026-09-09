import { ENNEAGRAM_QUESTION_TYPES } from './enneagram_mapping';
import { getEnneagramCoreInfo, getEnneagramWingInfo } from './enneagram_dictionary';

export function calculateEnneagramScore(answers: Record<string, string>) {
  const scores: Record<number, number> = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
  };

  for (let i = 0; i < 180; i++) {
    const tipe = ENNEAGRAM_QUESTION_TYPES[i];
    if (!tipe) continue;
    
    let val = Number(answers[i.toString()]);
    if (isNaN(val) || val < 0 || val > 3) {
      val = 0;
    }
    
    scores[tipe] += val;
  }
  
  let maxScore = -1;
  for (let i = 1; i <= 9; i++) {
    if (scores[i] > maxScore) {
      maxScore = scores[i];
    }
  }
  
  const dominantArr: number[] = [];
  for (let i = 1; i <= 9; i++) {
    if (scores[i] === maxScore) {
      dominantArr.push(i);
    }
  }
  
  let dominantLabel = '';
  let wingCode: string | null = null;
  
  if (dominantArr.length > 1) {
    dominantLabel = dominantArr.map(n => `Tipe ${n}`).join(' & ');
  } else if (dominantArr.length === 1) {
    const dominan = dominantArr[0];
    dominantLabel = dominan.toString();
    
    const neighbors: Record<number, number[]> = {
      1: [9, 2],
      2: [1, 3],
      3: [2, 4],
      4: [3, 5],
      5: [4, 6],
      6: [5, 7],
      7: [6, 8],
      8: [7, 9],
      9: [8, 1],
    };
    
    const [n1, n2] = neighbors[dominan];
    if (scores[n1] > scores[n2]) {
      wingCode = `${dominan}w${n1}`;
    } else if (scores[n2] > scores[n1]) {
      wingCode = `${dominan}w${n2}`;
    }
  }
  
  const dominantInfo = dominantArr.length === 1 ? getEnneagramCoreInfo(dominantArr[0]) : null;
  const wingInfo = wingCode ? getEnneagramWingInfo(wingCode) : null;
  
  return {
    completed: true,
    total_answers: Object.keys(answers || {}).length,
    submitted_at: new Date().toISOString(),
    scores,
    dominantLabel,
    dominantArr,
    maxScore,
    wingCode,
    dominantInfo,
    wingInfo
  };
}
