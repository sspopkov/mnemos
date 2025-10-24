import { useMemo, useState } from 'react';
import {
    AppBar,
    Box,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItemButton,
    ListItemText,
    Toolbar,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import type { Theme } from '@mui/material/styles';
import type { PaletteMode } from '@mui/material';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom'; // ⬅️ добавили

import { DRAWER_WIDTH } from '../../utils/layout';

export type NavigationItem = {
    label: string;
    href: string;
    description?: string;
};

type AppShellProps = {
    navItems: NavigationItem[];
    colorMode: PaletteMode;
    onToggleColorMode: () => void;
};

export const AppShell = ({ navItems, colorMode, onToggleColorMode }: AppShellProps) => {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const currentYear = useMemo(() => new Date().getFullYear(), []);
    const location = useLocation(); // ⬅️ где мы сейчас

    const handleDrawerToggle = () => setMobileOpen((prev) => !prev);
    const handleNavClick = () => {
        // на мобильном — закрыть меню после перехода
        if (!isDesktop) setMobileOpen(false);
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
                        item.href === '/'
                            ? location.pathname === '/'
                            : location.pathname.startsWith(item.href);

                    return (
                        <ListItemButton
                            key={item.href}
                            component={RouterLink}   // ⬅️ было <a>, теперь RouterLink
                            to={item.href}
                            onClick={handleNavClick}
                            selected={selected}      // ⬅️ подсветка активного
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
                        title={colorMode === 'dark' ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
                    >
                        <IconButton color="inherit" onClick={onToggleColorMode} aria-label="Переключить тему">
                            {colorMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                        </IconButton>
                    </Tooltip>
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
