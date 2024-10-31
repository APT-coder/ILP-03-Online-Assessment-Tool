import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../shared/constants/apiUrl';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private authApiUrl = `${apiUrl}/api/Auth`;

  constructor(private http: HttpClient) {}

  getApiToken() {
    const token = localStorage.getItem("apiToken");
    return token;
  }

  getUserRole(token: string): Observable<any> {
    const url = `${this.authApiUrl}/AzureSSOLogin/getUserRole/${token}`;
    return this.http.get<any>(url);
  }

  externalTrainerLogin(loginRequest: any): Observable<any> {
    const url = `${this.authApiUrl}/ExternalUserLogin`;
    return this.http.post<any>(url, loginRequest);
  }

  generateOtp(email: string): Observable<any> {
    const url = `${this.authApiUrl}/GenerateOtp/generate`;
    const payload = {
      email: email
    }
    return this.http.post<any>(url, payload);
  }

  verifyOtp(email: string, otp: string): Observable<any> {
    const url = `${this.authApiUrl}/VerifyOtp/verify`;
    const payload = {
      email: email,
      otp: otp
    }
    return this.http.post<any>(url, payload);
  }

  resetPassword(email: string, password: string): Observable<any> {
    const url = `${this.authApiUrl}/TrainerResetPassword`;
    const payload = {
      email: email,
      password: password
    }
    return this.http.put<any>(url, payload);
  }
}
