import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useRatings } from './hooks/useRatings';
import { HomeScreen } from './screens/HomeScreen';
import { AddRatingScreen } from './screens/AddRatingScreen';
import { RatingDetailScreen } from './screens/RatingDetailScreen';

function App() {
  const { ratings, isLoaded, error, addRating, updateRating, deleteRating, getRating, getStats } = useRatings();

  // Show loading state
  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-ih-bg dark:bg-ih-bg-dark">
        <div className="text-ih-text-muted dark:text-ih-text-muted-dark">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="h-full max-w-md mx-auto">
        {error && (
          <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-sm p-2 text-center z-50">
            {error}
          </div>
        )}
        <Routes>
          <Route
            path="/"
            element={<HomeScreen ratings={ratings} stats={getStats()} />}
          />
          <Route
            path="/add"
            element={<AddRatingScreen onSave={addRating} />}
          />
          <Route
            path="/rating/:id"
            element={
              <RatingDetailScreen getRating={getRating} ratings={ratings} onDelete={deleteRating} />
            }
          />
          <Route
            path="/rating/:id/edit"
            element={
              <AddRatingScreen onSave={addRating} onUpdate={updateRating} getRating={getRating} ratings={ratings} />
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
