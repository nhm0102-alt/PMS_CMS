/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import BillingPayment from './pages/BillingPayment';
import CheckInOut from './pages/CheckInOut';
import FinancialManagement from './pages/FinancialManagement';
import GuestManagement from './pages/GuestManagement';
import HotelDashboard from './pages/HotelDashboard';
import HotelSettings from './pages/HotelSettings';
import LicenseManagement from './pages/LicenseManagement';
import NewReservation from './pages/NewReservation';
import OTAChannels from './pages/OTAChannels';
import PolicySettings from './pages/PolicySettings';
import PricingCalendar from './pages/PricingCalendar';
import PropertiesManagement from './pages/PropertiesManagement';
import RatePlanManagement from './pages/RatePlanManagement';
import Reports from './pages/Reports';
import ReservationCalendar from './pages/ReservationCalendar';
import ReservationList from './pages/ReservationList';
import RoomChart from './pages/RoomChart';
import RoomManagement from './pages/RoomManagement';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SystemSettings from './pages/SystemSettings';
import UsersManagement from './pages/UsersManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "BillingPayment": BillingPayment,
    "CheckInOut": CheckInOut,
    "FinancialManagement": FinancialManagement,
    "GuestManagement": GuestManagement,
    "HotelDashboard": HotelDashboard,
    "HotelSettings": HotelSettings,
    "LicenseManagement": LicenseManagement,
    "NewReservation": NewReservation,
    "OTAChannels": OTAChannels,
    "PolicySettings": PolicySettings,
    "PricingCalendar": PricingCalendar,
    "PropertiesManagement": PropertiesManagement,
    "RatePlanManagement": RatePlanManagement,
    "Reports": Reports,
    "ReservationCalendar": ReservationCalendar,
    "ReservationList": ReservationList,
    "RoomChart": RoomChart,
    "RoomManagement": RoomManagement,
    "SuperAdminDashboard": SuperAdminDashboard,
    "SystemSettings": SystemSettings,
    "UsersManagement": UsersManagement,
}

export const pagesConfig = {
    mainPage: "SuperAdminDashboard",
    Pages: PAGES,
    Layout: __Layout,
};
