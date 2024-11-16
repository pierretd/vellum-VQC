export const TranscriptInput = function TranscriptInput() {
  // Add handleScore function or receive it as a prop
  const handleScore = () => {
    // Implement scoring logic here
    console.log('Scoring transcript...');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (!e.shiftKey) {
        e.preventDefault();
        handleScore();
      }
    }
  };

  return (
    <div>
      <textarea
        // ... other props ...
        onKeyDown={handleKeyDown}
      />
      {/* ... rest of the component ... */}
    </div>
  );
} 