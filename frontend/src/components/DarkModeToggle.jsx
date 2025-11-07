export default function DarkModeToggle({theme,setTheme}){
  return (
    <button className="btn btn-outline-secondary btn-sm"
      onClick={()=>setTheme(theme==='light'?'dark':'light')}>
      {theme==='light' ? 'Dark' : 'Light'}
    </button>
  );
}
