import { useState, useEffect, useCallback } from 'react';

interface TypingAnimationOptions {
  text: string;
  speed?: number;
  delay?: number;
  loop?: boolean;
  onComplete?: () => void;
}

export const useTypingAnimation = ({
  text,
  speed = 50,
  delay = 0,
  loop = false,
  onComplete
}: TypingAnimationOptions) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const startTyping = useCallback(() => {
    setIsPlaying(true);
    setCurrentIndex(0);
    setDisplayedText('');
    setIsComplete(false);
  }, []);

  const stopTyping = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const resetTyping = useCallback(() => {
    setCurrentIndex(0);
    setDisplayedText('');
    setIsComplete(false);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const initialTimer = setTimeout(() => {
      setIsPlaying(true);
    }, delay);

    return () => clearTimeout(initialTimer);
  }, [delay, isPlaying]);

  useEffect(() => {
    if (!isPlaying || isComplete) return;

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else {
      setIsComplete(true);
      setIsPlaying(false);
      onComplete?.();
      
      if (loop) {
        setTimeout(() => {
          resetTyping();
          setIsPlaying(true);
        }, 2000);
      }
    }
  }, [currentIndex, text, speed, isComplete, isPlaying, onComplete, loop, resetTyping]);

  return {
    displayedText,
    isComplete,
    isPlaying,
    startTyping,
    stopTyping,
    resetTyping
  };
};

interface MultiTypingAnimationOptions {
  texts: string[];
  speed?: number;
  delay?: number;
  pauseBetween?: number;
  loop?: boolean;
  onComplete?: () => void;
}

export const useMultiTypingAnimation = ({
  texts,
  speed = 50,
  delay = 0,
  pauseBetween = 1000,
  loop = false,
  onComplete
}: MultiTypingAnimationOptions) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentText = texts[currentTextIndex] || '';

  const {
    displayedText: currentDisplayedText,
    isComplete: currentTextComplete,
    startTyping,
    stopTyping,
    resetTyping
  } = useTypingAnimation({
    text: currentText,
    speed,
    delay: currentTextIndex === 0 ? delay : 0,
    onComplete: () => {
      if (currentTextIndex < texts.length - 1) {
        setTimeout(() => {
          setCurrentTextIndex(prev => prev + 1);
        }, pauseBetween);
      } else {
        setIsComplete(true);
        setIsPlaying(false);
        onComplete?.();
        
        if (loop) {
          setTimeout(() => {
            resetAll();
            setIsPlaying(true);
          }, 2000);
        }
      }
    }
  });

  const resetAll = useCallback(() => {
    setCurrentTextIndex(0);
    setDisplayedText('');
    setIsComplete(false);
    setIsPlaying(false);
    resetTyping();
  }, [resetTyping]);

  useEffect(() => {
    setDisplayedText(currentDisplayedText);
  }, [currentDisplayedText]);

  useEffect(() => {
    if (isPlaying && !currentTextComplete) {
      startTyping();
    }
  }, [currentTextIndex, isPlaying, startTyping, currentTextComplete]);

  const startMultiTyping = useCallback(() => {
    setIsPlaying(true);
    setCurrentTextIndex(0);
    setIsComplete(false);
  }, []);

  const stopMultiTyping = useCallback(() => {
    setIsPlaying(false);
    stopTyping();
  }, [stopTyping]);

  return {
    displayedText,
    currentTextIndex,
    isComplete,
    isPlaying,
    startTyping: startMultiTyping,
    stopTyping: stopMultiTyping,
    resetTyping: resetAll
  };
};

interface TerminalTypingOptions {
  commands: Array<{
    command: string;
    output: string;
    delay?: number;
  }>;
  commandSpeed?: number;
  outputSpeed?: number;
  initialDelay?: number;
}

export const useTerminalTyping = ({
  commands,
  commandSpeed = 30,
  outputSpeed = 20,
  initialDelay = 1000
}: TerminalTypingOptions) => {
  const [currentCommandIndex, setCurrentCommandIndex] = useState(0);
  const [displayedCommands, setDisplayedCommands] = useState<Array<{
    command: string;
    output: string;
    isCommandComplete: boolean;
    isOutputComplete: boolean;
  }>>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentCommand = commands[currentCommandIndex];

  const {
    displayedText: displayedCommand,
    isComplete: commandComplete,
    startTyping: startCommandTyping
  } = useTypingAnimation({
    text: currentCommand?.command || '',
    speed: commandSpeed,
    onComplete: () => {
      // Start typing output after command is complete
      setTimeout(() => {
        startOutputTyping();
      }, 500);
    }
  });

  const {
    displayedText: displayedOutput,
    isComplete: outputComplete,
    startTyping: startOutputTyping
  } = useTypingAnimation({
    text: currentCommand?.output || '',
    speed: outputSpeed,
    onComplete: () => {
      // Move to next command after output is complete
      setTimeout(() => {
        if (currentCommandIndex < commands.length - 1) {
          setCurrentCommandIndex(prev => prev + 1);
        } else {
          setIsComplete(true);
          setIsPlaying(false);
        }
      }, currentCommand?.delay || 1000);
    }
  });

  useEffect(() => {
    if (!isPlaying) return;

    if (currentCommandIndex === 0) {
      setTimeout(() => {
        startCommandTyping();
      }, initialDelay);
    } else {
      startCommandTyping();
    }
  }, [currentCommandIndex, isPlaying, startCommandTyping, initialDelay]);

  useEffect(() => {
    if (commandComplete || outputComplete) {
      setDisplayedCommands(prev => {
        const newCommands = [...prev];
        if (newCommands[currentCommandIndex]) {
          newCommands[currentCommandIndex] = {
            ...newCommands[currentCommandIndex],
            command: displayedCommand,
            output: displayedOutput,
            isCommandComplete: commandComplete,
            isOutputComplete: outputComplete
          };
        } else {
          newCommands.push({
            command: displayedCommand,
            output: displayedOutput,
            isCommandComplete: commandComplete,
            isOutputComplete: outputComplete
          });
        }
        return newCommands;
      });
    }
  }, [displayedCommand, displayedOutput, commandComplete, outputComplete, currentCommandIndex]);

  const startTerminalTyping = useCallback(() => {
    setIsPlaying(true);
    setCurrentCommandIndex(0);
    setDisplayedCommands([]);
    setIsComplete(false);
  }, []);

  const stopTerminalTyping = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const resetTerminalTyping = useCallback(() => {
    setCurrentCommandIndex(0);
    setDisplayedCommands([]);
    setIsComplete(false);
    setIsPlaying(false);
  }, []);

  return {
    displayedCommands,
    currentCommandIndex,
    isComplete,
    isPlaying,
    startTyping: startTerminalTyping,
    stopTyping: stopTerminalTyping,
    resetTyping: resetTerminalTyping
  };
};