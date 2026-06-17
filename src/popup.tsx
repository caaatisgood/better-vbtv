import { render } from 'solid-js/web';
import Popup from './components/Popup';
import './popup.css';

const root = document.getElementById('root');

if (root) {
  render(() => <Popup />, root);
}
