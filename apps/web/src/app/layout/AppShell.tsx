import { useMemo, useState, type MouseEvent } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import type { Theme } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom'; // ⬅️ добавили

import { DRAWER_WIDTH } from '../../utils/layout';
import type { AuthUser } from '../../api';

export type NavigationItem = {
  label: string;
  href: string;
  description?: string;
};

type AppShellProps = {
  navItems: NavigationItem[];
  colorMode: PaletteMode;
  onToggleColorMode: () => void;
  user: AuthUser;
  onLogout: () => void;
  logoutPending?: boolean;
};

export const AppShell = ({
  navItems,
  colorMode,
  onToggleColorMode,
  user,
  onLogout,
  logoutPending = false,
}: AppShellProps) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const location = useLocation(); // ⬅️ где мы сейчас
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const userInitial = useMemo(() => user.email.charAt(0).toUpperCase(), [user.email]);

  const isUserMenuOpen = Boolean(userMenuAnchor);

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev);
  const handleNavClick = () => {
    // на мобильном — закрыть меню после перехода
    if (!isDesktop) setMobileOpen(false);
  };

  const handleUserMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogoutClick = () => {
    handleUserMenuClose();
    onLogout();
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
          Mnemos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Панель управления
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flex: 1, py: 1 }}>
        {navItems.map((item) => {
          // простая логика активного пункта: начало пути совпадает
          const selected =
            item.href === '/' ? location.pathname === '/' : location.pathname.startsWith(item.href);

          return (
            <ListItemButton
              key={item.href}
              component={RouterLink} // ⬅️ было <a>, теперь RouterLink
              to={item.href}
              onClick={handleNavClick}
              selected={selected} // ⬅️ подсветка активного
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: 2,
              }}
            >
              <ListItemText
                primary={item.label}
                secondary={item.description}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Divider />
      <Box component="footer" sx={{ p: 3 }}>
        <Typography variant="caption" color="text.secondary">
          © {currentYear} Mnemos
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: (theme: Theme) => theme.palette.background.default,
      }}
    >
      <AppBar
        position="fixed"
        elevation={0}
        color="transparent"
        sx={{
          borderBottom: (theme: Theme) => `1px solid ${theme.palette.divider}`,
          backdropFilter: 'blur(10px)',
          backgroundImage: 'none',
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          {!isDesktop && (
            <IconButton
              color="inherit"
              aria-label="Открыть навигацию"
              edge="start"
              onClick={handleDrawerToggle}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Mnemos
          </Typography>

          <Tooltip
            title={
              colorMode === 'dark' ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'
            }
          >
            <IconButton color="inherit" onClick={onToggleColorMode} aria-label="Переключить тему">
              {colorMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>

          <Tooltip title={user.email}>
            <IconButton
              color="inherit"
              aria-label="Открыть меню пользователя"
              onClick={handleUserMenuOpen}
              size="small"
              sx={{ ml: 1 }}
            >
              <Avatar sx={{ width: 32, height: 32 }}>{userInitial}</Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={userMenuAnchor}
            open={isUserMenuOpen}
            onClose={handleUserMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            keepMounted
          >
            <MenuItem disabled sx={{ gap: 1, opacity: 1 }}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={user.email}
                secondary="Аккаунт"
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem onClick={handleLogoutClick} disabled={logoutPending} sx={{ gap: 1 }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Выйти" />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { lg: DRAWER_WIDTH }, flexShrink: { lg: 0 } }}
        aria-label="Основная навигация"
      >
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop ? true : mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', lg: 'block' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: (theme: Theme) => `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Box component="section" sx={{ flexGrow: 1, p: { xs: 2, sm: 3, md: 4 } }}>
          {/* ⬇️ ВАЖНО: теперь контент страниц приходит из роутера */}
          <Outlet />
        </Box>
        <Box
          component="footer"
          sx={{
            borderTop: (theme: Theme) => `1px solid ${theme.palette.divider}`,
            p: { xs: 2, sm: 3 },
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Сделано с заботой командой Mnemos.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
