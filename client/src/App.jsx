import { Route, Routes } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout/PublicLayout";
import Home from "./pages/Home/Home";

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
      </Route>
    </Routes>
  );
}

export default App;