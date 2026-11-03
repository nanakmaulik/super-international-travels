import type { Metadata, Viewport } from 'next';
export const metadata: Metadata = {
  title:'Zavpi Kiosk • Face Attendance',
  description:'Shared office face-attendance kiosk',
  manifest:'/manifest.webmanifest?v=3',
  appleWebApp:{capable:true,statusBarStyle:'black-translucent',title:'Zavpi Kiosk'},
  icons:{icon:[{url:'/icons/icon-192.png?v=3',sizes:'192x192',type:'image/png'},{url:'/icons/icon-512.png?v=3',sizes:'512x512',type:'image/png'}],apple:'/icons/apple-touch-icon.png?v=3'},
};
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#111d34'};
export default function KioskLayout({children}:{children:React.ReactNode}){return children;}
