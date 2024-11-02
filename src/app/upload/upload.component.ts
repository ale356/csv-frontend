import { Component } from '@angular/core';
import * as Papa from 'papaparse';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

interface User {
  id: number;
  fullName: string;
  username: string;
  email: string;
  password: string;
}

interface ValidationResult {
  user: User;
  validationResults: {
    Id: boolean;
    FullName: boolean;
    Username: boolean;
    Email: boolean;
    Password: boolean;
  };
}

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent {
  users: User[] = [];
  invalidEntries: ValidationResult[] = [];
  apiUrl: string = environment.REACT_APP_API_URL;

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          this.uploadUsers(results.data);
        },
      });
    }
  }

  uploadUsers(users: any[]): void {
    this.http.post(this.apiUrl, { users }).subscribe((response: any) => {
      this.users = response.savedUsers;
      this.invalidEntries = response.invalidEntries;
    }, error => {
      console.error('Error uploading users:', error);
    });
  }
}
