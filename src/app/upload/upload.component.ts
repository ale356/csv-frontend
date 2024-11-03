import { Component } from "@angular/core";
import * as Papa from "papaparse";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { CommonModule } from "@angular/common";

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
  selector: "app-upload",
  standalone: true,
  templateUrl: "./upload.component.html",
  styleUrls: ["./upload.component.css"],
  imports: [CommonModule],
})
export class UploadComponent {
  users: User[] = [];
  invalidEntries: ValidationResult[] = [];
  selectedFile: File | null = null; // Store the selected file here
  apiUrl: string = environment.apiUrl; // API URL from environment file

  constructor(private http: HttpClient) {} // HttpClient injection

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0]; // Save the selected file
    } else {
      console.error("No file selected or file input is invalid.");
    }
  }

  uploadUsers(): void {
    if (!this.selectedFile) {
      console.error("No file selected for upload.");
      return; // Prevent upload if no file is selected
    }

    if (this.selectedFile.type !== "text/csv") {
      console.error("Selected file is not a CSV.");
      return; // Validate if the file is a CSV
    }

    Papa.parse(this.selectedFile, {
      header: true,
      complete: (results) => {
        this.http.post(this.apiUrl, { users: results.data }).subscribe(
          (response: any) => {
            this.users = response.savedUsers;
            this.invalidEntries = response.invalidEntries;
          },
          (error: any) => {
            console.error("Error uploading users:", error);
          }
        );
      },
    });
    console.log('file uploaded')
  }
}
