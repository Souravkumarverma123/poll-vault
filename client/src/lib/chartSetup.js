/**
 * Chart.js global registration — imported once at the app entry point.
 * Centralizing registration here prevents duplicate calls when multiple
 * LiveAnalytics components mount, and keeps chart setup out of component files.
 */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);
