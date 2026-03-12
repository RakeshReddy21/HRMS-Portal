import {inject} from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from '../services/auth.service';
import { Role } from '../models/auth.model';

export const roleGuard = (...allowedRoles: Role[]) : CanActivateFn => {
    return () => {
        const authService = inject(AuthService);
        const router = inject(Router);

        if(authService.hasAnyRole(...allowedRoles)){
            return true;
        }
        if(authService.isLoggedIn()){
            authService.redirectByRole();
            return false;
        }
        router.navigate(['/login']);
        return false;
    };
};