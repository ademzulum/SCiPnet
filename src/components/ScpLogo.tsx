import logo from '../../images/scp_logo.svg';

// Foundation emblem; the SVG is black, CSS inverts it for the dark screen.
export default function ScpLogo({ size = 120 }: { size?: number }) {
  return <img className="scp-logo" src={logo} width={size} height={size} alt="SCP Foundation" draggable={false} />;
}
