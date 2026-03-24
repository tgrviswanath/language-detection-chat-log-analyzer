import { AppBar, Toolbar, Typography } from "@mui/material";
import TranslateIcon from "@mui/icons-material/Translate";

export default function Header() {
  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ gap: 1 }}>
        <TranslateIcon />
        <Typography variant="h6" fontWeight="bold">
          Language Detection & Chat Log Analyzer
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
