import RootNavigator from "./src/navigation/Navigation"
import { ThemeProvider } from "./src/contexts/ThemeContext"

export default function App() {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  )
}
