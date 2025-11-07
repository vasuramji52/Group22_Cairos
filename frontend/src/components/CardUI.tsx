// Old archi
import React, { useState } from 'react';
import { buildPath } from './path';
import { retrieveToken, storeToken } from '../tokenStorage';
import { useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  Calendar,
  Settings,
  Sun,
} from "lucide-react";
import { Dashboard } from "./dashboard_components/dashboard";
import { FriendsList } from "./dashboard_components/friends-list";
import { ScheduleCombine } from "./dashboard_components/schedule-combine";
import { ProfileSettings } from "./dashboard_components/profile-settings";
import { SundialIcon } from "./dashboard_components/egyptian-decorations";
import { Toaster } from "./ui/sonner";
import './ui/dashboard.css';

function CardUI()
{
    const navigate = useNavigate();

    useEffect(() => {
      const userData = localStorage.getItem("user_data");
      if (!userData) {
        // if no user, redirect to login
        navigate("/");
      }
    }, [navigate]);

    function doLogout(event?: any): void {
        event?.preventDefault();
        localStorage.removeItem('user_data');
        navigate("/");
    };

    const currentPath = location.pathname;
    /*const [message,setMessage] = useState('');
    const [searchResults,setResults] = useState('');
    const [cardList,setCardList] = useState('');
    const [search,setSearchValue] = React.useState('');
    const [card,setCardNameValue] = React.useState('');
    
    var _ud = localStorage.getItem('user_data');
    var ud = JSON.parse(String(_ud));
    var userId = ud.id;
//    var firstName = ud.firstName;
//    var lastName = ud.lastName;
    
    async function addCard(e:any) : Promise<void>
    {
        e.preventDefault();

        var obj = {userId:userId,card:card,jwtToken:retrieveToken()};
        var js = JSON.stringify(obj);

        try
        {
            const response = await fetch(buildPath('api/addcard'),
            {method:'POST',body:js,headers:{'Content-Type': 'application/json'}});

            let txt = await response.text();
            let res = JSON.parse(txt);

            if( res.error.length > 0 )
            {
                setMessage( "API Error:" + res.error );
            }
            else
            {
                setMessage('Card has been added');
                storeToken( res.jwtToken );             
            }
        }
        catch(error:any)
        {
            setMessage(error.toString());
        }
    };

    async function searchCard(e:any) : Promise<void>
    {
        e.preventDefault();
        
        var obj = {userId:userId,search:search,jwtToken:retrieveToken()};
        var js = JSON.stringify(obj);

        try
        {
            const response = await fetch(buildPath('api/searchcards'),
            {method:'POST',body:js,headers:{'Content-Type': 'application/json'}});

            let txt = await response.text();
            let res = JSON.parse(txt);
            let _results = res.results;
            let resultText = '';
            for( let i=0; i<_results.length; i++ )
            {
                resultText += _results[i];
                if( i < _results.length - 1 )
                {
                    resultText += ', ';
                }
            }
            setResults('Card(s) have been retrieved');
            storeToken( res.jwtToken );
            setCardList(resultText);
        }
        catch(error:any)
        {
            alert(error.toString());
            setResults(error.toString());
        }
    };

    function handleSearchTextChange( e: any ) : void
    {
        setSearchValue( e.target.value );
    }

    function handleCardTextChange( e: any ) : void
    {
        setCardNameValue( e.target.value );
    }*/

    return (
    <div className="flex min-h-screen bg-[#1B4B5A]">
      {/* Sidebar */}
      <aside className="relative w-64 border-r-2 border-[#D4AF37]/30 flex flex-col overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B4B5A] to-[#0F2A34]">
          <div
            className="absolute inset-0 opacity-5 bg-cover bg-center bg-no-repeat pointer-events-none"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1738512164098-9487d6d501e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaWVyb2dseXBoaWNzJTIwZWd5cHRpYW4lMjBzeW1ib2xzfGVufDF8fHx8MTc2MTY2MDQ2Nnww&ixlib=rb-4.1.0&q=80&w=1080')`,
            }}
          />
        </div>
        
        {/* Sidebar content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="p-6 border-b border-[#D4AF37]/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#C5A572] flex items-center justify-center">
                <SundialIcon className="w-6 h-6 text-[#1B4B5A]" />
              </div>
              <div>
                <h2 className="text-[#D4AF37] tracking-wider">CAIROS</h2>
                <p className="text-[#C5A572] text-xs">Find your moment</p>
              </div>
            </div>
          </div>
        
          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <Link
              to="/cards/dashboard"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentPath === "/cards/dashboard"
                  ? "bg-[#D4AF37] text-[#1B4B5A]"
                  : "text-[#C5A572] hover:bg-[#2C6E7E] hover:text-[#D4AF37]"
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            
            <Link
              to="/cards/friends"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentPath === "/cards/friends"
                  ? "bg-[#D4AF37] text-[#1B4B5A]"
                  : "text-[#C5A572] hover:bg-[#2C6E7E] hover:text-[#D4AF37]"
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Your Circle</span>
            </Link>
            
            <Link
              to="/cards/schedule"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentPath === "/cards/schedule"
                  ? "bg-[#D4AF37] text-[#1B4B5A]"
                  : "text-[#C5A572] hover:bg-[#2C6E7E] hover:text-[#D4AF37]"
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span>Find Time</span>
            </Link>
            
            <Link
              to="/cards/settings"
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentPath === "/cards/settings"
                  ? "bg-[#D4AF37] text-[#1B4B5A]"
                  : "text-[#C5A572] hover:bg-[#2C6E7E] hover:text-[#D4AF37]"
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </Link>
          </nav>
            
          {/* Footer - Egyptian motif */}
          <div className="p-6 border-t border-[#D4AF37]/30">
            <div className="flex items-center justify-center gap-2 text-[#D4AF37] opacity-50">
              <Sun className="w-4 h-4" />
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-[#D4AF37]" />
                ))}
              </div>
              <Sun className="w-4 h-4" />
            </div>
            <p className="text-center text-[#C5A572] mt-2 text-xs">
              Like the Nile flows eternal
            </p>
          </div>
        </div>
      </aside>
            
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="dashboard" element={<Dashboard onNavigate={navigate} />} />
          <Route path="friends" element={<FriendsList />} />
          <Route path="schedule" element={<ScheduleCombine />} />
          <Route path="settings" element={<ProfileSettings onLogout={doLogout} />} />
          {/* Default to dashboard if no subroute */}
          <Route path="*" element={<Dashboard onNavigate={navigate} />} />
        </Routes>
      </main>
            
      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#F5E6D3",
            color: "#1B4B5A",
            border: "2px solid #D4AF37",
          },
        }}
      />
    </div>

  );
}

export default CardUI;
