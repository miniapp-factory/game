"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const GRID_SIZE = 4;
const TILE_VALUES = [2, 4];
const TILE_PROBABILITIES = [0.9, 0.1];

function getRandomTile() {
  return Math.random() < TILE_PROBABILITIES[0] ? TILE_VALUES[0] : TILE_VALUES[1];
}

function cloneBoard(board: number[][]) {
  return board.map(row => [...row]);
}

export default function Game2048() {
  const [board, setBoard] = useState<number[][]>(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0)));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  // Add a random tile to an empty spot
  const addRandomTile = (b: number[][]) => {
    const empty: [number, number][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (b[r][c] === 0) empty.push([r, c]);
      }
    }
    if (empty.length === 0) return b;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    b[r][c] = getRandomTile();
    return b;
  };

  // Initialize board with two tiles
  useEffect(() => {
    let b = cloneBoard(board);
    b = addRandomTile(b);
    b = addRandomTile(b);
    setBoard(b);
  }, []);

  // Merge logic for a single row or column
  const mergeLine = (line: number[]) => {
    const filtered = line.filter(v => v !== 0);
    const merged: number[] = [];
    let i = 0;
    while (i < filtered.length) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        merged.push(filtered[i] * 2);
        setScore(prev => prev + filtered[i] * 2);
        i += 2;
      } else {
        merged.push(filtered[i]);
        i += 1;
      }
    }
    while (merged.length < GRID_SIZE) merged.push(0);
    return merged;
  };

  const move = (direction: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    let rotated = cloneBoard(board);
    // Rotate board to simplify movement logic
    const rotate = (b: number[][], times: number) => {
      let res = b;
      for (let t = 0; t < times; t++) {
        const newB: number[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
        for (let r = 0; r < GRID_SIZE; r++) {
          for (let c = 0; c < GRID_SIZE; c++) {
            newB[c][GRID_SIZE - 1 - r] = res[r][c];
          }
        }
        res = newB;
      }
      return res;
    };
    // Map direction to rotation count
    const dirMap: Record<string, number> = { left: 0, up: 1, right: 2, down: 3 };
    rotated = rotate(rotated, dirMap[direction]);

    const newBoard: number[][] = [];
    let moved = false;
    for (let r = 0; r < GRID_SIZE; r++) {
      const merged = mergeLine(rotated[r]);
      if (!moved && JSON.stringify(merged) !== JSON.stringify(rotated[r])) moved = true;
      newBoard.push(merged);
    }

    if (!moved) return;

    // Rotate back to original orientation
    const backRotated = rotate(newBoard, (4 - dirMap[direction]) % 4);
    setBoard(backRotated);

    // Add new tile
    const afterAdd = addRandomTile(backRotated);
    setBoard(afterAdd);

    // Check win
    if (afterAdd.flat().includes(2048)) setGameWon(true);

    // Check game over
    const hasEmpty = afterAdd.flat().some(v => v === 0);
    const canMerge = () => {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (c + 1 < GRID_SIZE && afterAdd[r][c] === afterAdd[r][c + 1]) return true;
          if (r + 1 < GRID_SIZE && afterAdd[r][c] === afterAdd[r + 1][c]) return true;
        }
      }
      return false;
    };
    if (!hasEmpty && !canMerge()) setGameOver(true);
  };

  const handleShare = () => {
    const shareText = `I scored ${score} in 2048! ${url}`;
    // The Share component handles the actual sharing logic
    // We just render it with the text
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {board.flat().map((val, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-center h-16 w-16 rounded-md text-2xl font-bold ${
              val === 0
                ? "bg-gray-200 text-gray-500"
                : val <= 4
                ? "bg-yellow-200 text-yellow-800"
                : val <= 8
                ? "bg-orange-200 text-orange-800"
                : val <= 16
                ? "bg-red-200 text-red-800"
                : "bg-purple-200 text-purple-800"
            }`}
          >
            {val !== 0 ? val : null}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => move("up")}>↑</Button>
        <Button variant="outline" onClick={() => move("left")}>←</Button>
        <Button variant="outline" onClick={() => move("right")}>→</Button>
        <Button variant="outline" onClick={() => move("down")}>↓</Button>
      </div>
      <div className="text-xl">Score: {score}</div>
      {(gameOver || gameWon) && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-lg font-semibold">
            {gameWon ? "You won!" : "Game Over"}
          </div>
          <Share text={`I scored ${score} in 2048! ${url}`} />
        </div>
      )}
    </div>
  );
}
