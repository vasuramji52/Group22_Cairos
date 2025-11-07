// Old archi
import React, { useState } from 'react';
import { buildPath } from './path';
import { retrieveToken, storeToken } from '../tokenStorage';
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
import './ui/index2.css';

type View = "dashboard" | "friends" | "schedule" | "settings";

function CardUI()
{
    const [currentView, setCurrentView] = useState<View>("dashboard");

    function doLogout(event?: any): void {
        event?.preventDefault();
        localStorage.removeItem('user_data');
        window.location.href = '/';
    };

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
      <aside className="w-64 bg-gradient-to-b from-[#1B4B5A] to-[#0F2A34] border-r-2 border-[#D4AF37]/30 flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#D4AF37] to-[#C5A572] flex items-center justify-center">
              <SundialIcon className="w-6 h-6 text-[#1B4B5A]" />
            </div>
            <div>
              <h2 className="text-[#D4AF37] tracking-wider">
                CAIROS
              </h2>
              <p className="text-[#C5A572] text-xs">
                Find your moment
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setCurrentView("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              currentView === "dashboard"
                ? "bg-[#D4AF37] text-[#1B4B5A]"
                : "text-[#C5A572] hover:bg-[#2C6E7E] hover:text-[#D4AF37]"
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentView("friends")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              currentView === "friends"
                ? "bg-[#D4AF37] text-[#1B4B5A]"
                : "text-[#C5A572] hover:bg-[#2C6E7E] hover:text-[#D4AF37]"
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Your Circle</span>
          </button>

          <button
            onClick={() => setCurrentView("schedule")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              currentView === "schedule"
                ? "bg-[#D4AF37] text-[#1B4B5A]"
                : "text-[#C5A572] hover:bg-[#2C6E7E] hover:text-[#D4AF37]"
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span>Find Time</span>
          </button>

          <button
            onClick={() => setCurrentView("settings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              currentView === "settings"
                ? "bg-[#D4AF37] text-[#1B4B5A]"
                : "text-[#C5A572] hover:bg-[#2C6E7E] hover:text-[#D4AF37]"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Footer - Egyptian motif */}
        <div className="p-6 border-t border-[#D4AF37]/30">
          <div className="flex items-center justify-center gap-2 text-[#D4AF37] opacity-50">
            <Sun className="w-4 h-4" />
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-[#D4AF37]"
                />
              ))}
            </div>
            <Sun className="w-4 h-4" />
          </div>
          <p className="text-center text-[#C5A572] mt-2 text-xs">
            Like the Nile flows eternal
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {currentView === "dashboard" && (
          <Dashboard onNavigate={setCurrentView} />
        )}
        {currentView === "friends" && <FriendsList />}
        {currentView === "schedule" && <ScheduleCombine />}
        {currentView === "settings" && (
          <ProfileSettings onLogout={doLogout} />
        )}
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
