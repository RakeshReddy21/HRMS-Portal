import { Component, signal } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { sidebar } from "./sidebar/sidebar";
import { Header } from "./header/header";
import { AIChatbot } from "../pages/ai-chat/ai-chat";

@Component({
    selector: 'app-layout',
    imports: [RouterOutlet, sidebar, Header, AIChatbot],
    templateUrl: './layout.html',
    styleUrl: './layout.css',
})

export class Layout {
    sidebarOpen = signal(false);
    toggleSidebar(): void{
        this.sidebarOpen.update(v => !v);
    }
    closeSidebar(): void{
        this.sidebarOpen.set(false);
    }
}