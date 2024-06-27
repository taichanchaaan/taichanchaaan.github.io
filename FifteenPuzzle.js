import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../index.css';

const FifteenPuzzle = () => {
  const [mode, setMode] = useState('normal');
  const [board, setBoard] = useState([]);
  const [size, setSize] = useState({ rows: 4, columns: 4 });
  const [moves, setMoves] = useState(0);
  const [time, setTime] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [image, setImage] = useState(null);
  const [assistMode, setAssistMode] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCleared, setGameCleared] = useState(false);
  const fileInputRef = useRef(null);

  const generateBoard = useCallback(() => {
    const { rows, columns } = size;
    const totalTiles = rows * columns;
    let newBoard;
    do {
      newBoard = Array.from({ length: totalTiles - 1 }, (_, index) => index + 1);
      newBoard.push('');
      newBoard = shuffleBoard(newBoard);
    } while (!isSolvable(newBoard, rows, columns));
    setBoard(chunks(newBoard, columns));
    setGameCleared(false);
  }, [size]);

  useEffect(() => {
    generateBoard();
  }, [size, generateBoard]);

  const shuffleBoard = (flatBoard) => {
    const shuffledBoard = [...flatBoard];
    for (let i = shuffledBoard.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledBoard[i], shuffledBoard[j]] = [shuffledBoard[j], shuffledBoard[i]];
    }
    return shuffledBoard;
  };

  const chunks = (arr, size) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size)
    );

  const isSolvable = (board, rows, columns) => {
    const flatBoard = board.flat ? board.flat() : board;
    let inversions = 0;
    const emptyTileIndex = flatBoard.indexOf('');
    for (let i = 0; i < flatBoard.length - 1; i++) {
      for (let j = i + 1; j < flatBoard.length; j++) {
        if (flatBoard[i] && flatBoard[j] && flatBoard[i] > flatBoard[j]) {
          inversions++;
        }
      }
    }
    if (columns % 2 === 1) {
      return inversions % 2 === 0;
    } else {
      const emptyRow = Math.floor(emptyTileIndex / columns);
      return (inversions + emptyRow) % 2 === 1;
    }
  };

  const isBoardInOrder = (board) => {
    const flatBoard = board.flat();
    for (let i = 0; i < flatBoard.length - 1; i++) {
      if (flatBoard[i] !== i + 1) return false;
    }
    return flatBoard[flatBoard.length - 1] === '';
  };

  const handleCellClick = (rowIndex, colIndex) => {
    if (mode === 'image' && !image) return;

    const emptyCell = findEmptyCell();
    if (isValidMove(rowIndex, colIndex, emptyCell)) {
      let newBoard = [];
      setBoard((prevBoard) => {
        newBoard = prevBoard.map(row => [...row]);
        const [rowDir, colDir] = [Math.sign(rowIndex - emptyCell.row), Math.sign(colIndex - emptyCell.col)];
        let currentRow = emptyCell.row, currentCol = emptyCell.col;
        while (currentRow !== rowIndex || currentCol !== colIndex) {
          const nextRow = currentRow + rowDir, nextCol = currentCol + colDir;
          newBoard[currentRow][currentCol] = newBoard[nextRow][nextCol];
          currentRow = nextRow;
          currentCol = nextCol;
        }
        newBoard[rowIndex][colIndex] = '';
        return newBoard;
      });
      setMoves((prevMoves) => prevMoves + 1);
      if (!gameStarted) {
        setGameStarted(true);
        const id = setInterval(() => setTime((prevTime) => prevTime + 1), 1000);
        setIntervalId(id);
      }
      if (isBoardInOrder(newBoard)) {
        clearInterval(intervalId);
        setRankings((prevRankings) => [...prevRankings, { moves: moves + 1, time }]);
        setGameCleared(true);
      }
    }
  };

  const findEmptyCell = () => {
    for (let rowIndex = 0; rowIndex < board.length; rowIndex++) {
      for (let colIndex = 0; colIndex < board[rowIndex].length; colIndex++) {
        if (board[rowIndex][colIndex] === '') {
          return { row: rowIndex, col: colIndex };
        }
      }
    }
    return null;
  };

  const isValidMove = (rowIndex, colIndex, emptyCell) => {
    return rowIndex === emptyCell.row || colIndex === emptyCell.col;
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setImage(null);
    setSize({ rows: 4, columns: 4 });
    generateBoard();
  };

  const handleSizeChange = (event) => {
    const { name, value } = event.target;
    setSize((prevSize) => ({
      ...prevSize,
      [name]: parseInt(value, 10),
    }));
  };

  const handleNewGame = () => {
    setMoves(0);
    setTime(0);
    setGameStarted(false);
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    generateBoard();
  };

  const handleReset = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setMoves(0);
    setTime(0);
    setGameStarted(false);
    setImage(null);
    setSize({ rows: 4, columns: 4 });
    generateBoard();
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (mode === 'image' && image) {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        let rows = 4;
        let columns = Math.round(4 * aspectRatio);
        columns = Math.max(2, columns);
        setSize({ rows, columns });
      };
      img.src = image;
    }
  }, [image, mode]);

  const handleAssistModeChange = () => {
    setAssistMode(!assistMode);
  };

  const handleImageDropAreaClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="puzzle-container">
      <h1 className="title">15 Puzzle Game</h1>
      <div className="controls">
        <div className="mode-buttons">
          <button
            className={`mode-button ${mode === 'normal' ? 'active' : ''}`}
            onClick={() => handleModeChange('normal')}
          >
            通常モード
          </button>
          <button
            className={`mode-button ${mode === 'image' ? 'active' : ''}`}
            onClick={() => handleModeChange('image')}
          >
            画像モード
          </button>
        </div>
        <div className="size-controls">
          {mode === 'normal' && (
            <>
              縦:
              <input
                type="number"
                name="rows"
                className="size-input"
                value={size.rows}
                onChange={handleSizeChange}
                min="2"
                max="10"
              />
              横:
              <input
                type="number"
                name="columns"
                className="size-input"
                value={size.columns}
                onChange={handleSizeChange}
                min="2"
                max="10"
              />
            </>
          )}
        </div>
        <button className="new-game-button" onClick={handleNewGame}>
          新しいゲーム
        </button>
        <button className="reset-button" onClick={handleReset}>
          リセット
        </button>
        {mode === 'image' && (
          <div className="image-controls">
            <button className="image-upload-button" onClick={handleImageDropAreaClick}>
              画像を変更
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
            {image && <img src={image} alt="uploaded" className="uploaded-image-preview" />}
          </div>
        )}
        {mode === 'image' && (
          <div className="assist-mode">
            <label>
              <input type="checkbox" checked={assistMode} onChange={handleAssistModeChange} />
              補助モード
            </label>
          </div>
        )}
      </div>
      <div
        className="board"
        style={{
          gridTemplateRows: `repeat(${size.rows}, 1fr)`,
          gridTemplateColumns: `repeat(${size.columns}, 1fr)`,
          aspectRatio: `${size.columns} / ${size.rows}`,
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              className={`cell ${cell === '' ? 'empty' : ''}`}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              style={{
                backgroundImage: mode === 'image' && cell && image ? `url(${image})` : 'none',
                backgroundSize: `${size.columns * 100}% ${size.rows * 100}%`,
                backgroundPosition: mode === 'image' && cell && image
                  ? `${((cell - 1) % size.columns) / (size.columns - 1) * 100}% ${Math.floor((cell - 1) / size.columns) / (size.rows - 1) * 100}%`
                  : 'none',
                border: mode === 'image' && assistMode && cell ? '1px solid #000' : 'none',
                color: mode === 'image' && assistMode && cell ? '#fff' : 'inherit',
                textShadow: mode === 'image' && assistMode && cell ? '2px 2px 4px #000' : 'none',
              }}
            >
              {mode === 'normal' || assistMode ? cell : ''}
            </button>
          ))
        )}
      </div>
      <div className="stats">
        <p>移動回数: {moves}</p>
        <p>経過時間: {time}秒</p>
      </div>
      {gameCleared && (
        <div className="completion-message">
          <p>クリア！おめでとう！</p>
          <p>移動回数: {moves} 手</p>
          <p>経過時間: {time} 秒</p>
          <div className="completed-board">
            {board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className="completed-cell"
                  style={{
                    backgroundImage: mode === 'image' && cell && image ? `url(${image})` : 'none',
                    backgroundSize: `${size.columns * 100}% ${size.rows * 100}%`,
                    backgroundPosition: mode === 'image' && cell && image
                      ? `${((cell - 1) % size.columns) / (size.columns - 1) * 100}% ${Math.floor((cell - 1) / size.columns) / (size.rows - 1) * 100}%`
                      : 'none',
                    border: '1px solid #000',
                    color: '#fff',
                    textShadow: '2px 2px 4px #000',
                  }}
                >
                  {cell}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <div className="rankings">
        <h2>ランキング</h2>
        <table>
          <thead>
            <tr>
              <th>順位</th>
              <th>移動回数</th>
              <th>時間</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((ranking, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{ranking.moves}</td>
                <td>{ranking.time}秒</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FifteenPuzzle;
