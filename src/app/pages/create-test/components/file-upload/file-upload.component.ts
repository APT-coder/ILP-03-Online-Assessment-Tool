import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { WordParserService } from '../../../../service/doc-parser/word-parser.service';
import { MessageService } from 'primeng/api';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';

interface Question {
  id: string
  type: string;
  content: string;
  options?: string[];
  correctAnswer?: string[];
  score: number;
  userAnswer?: string;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [ButtonModule, DialogModule, CommonModule],
  providers: [MessageService],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss'
})
export class FileUploadComponent {
  @Output() uploadSuccess = new EventEmitter<Question[]>();
  @Output() message = new EventEmitter<string>();

  supportedFiles = '.docx, .xlsx, .doc, .xls';
  uploaded: boolean = false;
  visibleTemplatePreview: boolean = false;
  wordTemplateContent: any;
  isWordPreview: boolean = true;
  excelTemplateContent: string = '';
  isExcel: boolean = false;
  questionCount: number = 0;

  questions: Question[] = [];
  fileType: string = '';
  htmlContent: string = '';
  questionContent: any;

  constructor(private wordParserService: WordParserService,
    private http: HttpClient,
    private messageService: MessageService) {}

  async handleFileInput(event: Event) {
    if (event.target instanceof HTMLInputElement) {
      const fileInput = event.target as HTMLInputElement;
      const file = fileInput.files?.[0];
      if (file) {
        console.log('Selected file from input:', file);

        await this.uploadFile(file);
      }
    }
    if (event instanceof DragEvent && event.dataTransfer) {
      const file = event.dataTransfer.files?.[0];
      if (file) {
        console.log('Dropped file(s):', file);

        await this.uploadFile(file);
      }
    }

    if(this.uploaded){
      this.message.emit(`Upload Success!${this.questionCount}`);
      if(this.fileType === "word"){
        await this.parseQuestions(this.htmlContent);
      }
      else if(this.fileType === "excel"){
        await this.convertData(this.questionContent);
      }
      this.uploadSuccess.emit(this.questions);
    }
    else{
      this.message.emit("Upload Failed");
    }
  }

  async onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    const dropArea = document.getElementById('drag-drop-area');
    if (dropArea) {
      dropArea.classList.add('highlight');
    }
  }

  async onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.handleFileInput(event);
    const dropArea = document.getElementById('drag-drop-area');
    if (dropArea) {
      dropArea.classList.remove('highlight');
    }
  }

  openFileDialog() {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  async uploadFile(file: File) {
    if (file) {
      if(file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'){
        try {
          this.htmlContent = await this.wordParserService.readWordFile(file);
          console.log('HTML Content:', this.htmlContent);
          this.uploaded = true;

          this.questionCount = await this.getQuestionCount(this.htmlContent, "word");
          this.fileType = "word";
        } catch (error) {
          console.error('Error parsing the Word file:', error);
        }
      }
      else if(file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.type === 'application/vnd.ms-excel'){
        try {
          this.questionContent = await this.wordParserService.readExcelFile(file);
          console.log('File Content', this.questionContent);
          this.uploaded = true;

          this.questionCount = await this.getQuestionCount(this.questionContent, "excel");
          this.fileType = "excel";
        } catch (error) {
          console.error('Error parsing the Excel file:', error);
        }
      }
    } 
    else {
      console.log('No valid file selected.');
    }
  }

  async getQuestionCount(content: any, type: string): Promise<number> {
    let questionCount = 0;

    if(type === "word"){
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const paragraphs = doc.querySelectorAll('p');
      paragraphs.forEach((p) => {
        const text = p.innerText.trim();
        if (text.startsWith('Question:')) {
          questionCount++;
        }
      });
    }

    else if(type === "excel"){
      if (!Array.isArray(content) || content.length < 1) {
        return 0;
      }
      const questions = content.slice(1);
      console.log(questions.length);
      questionCount = questions.length;
    }

    return questionCount;
  }

  onToggleChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.isExcel = inputElement.checked;
    this.isWordPreview = !inputElement.checked;
    if (!this.isWordPreview) {
      this.loadExcelFile();
    }
  }

  getPreviewHeading(): string {
    return this.isWordPreview ? 'Word Preview Template (.docx)' : 'Excel Preview Template (.xlsx)';
  }

  loadExcelFile(): void {
    const filePath = 'assets/Assessment_Template.xlsx';

    this.http.get(filePath, { responseType: 'arraybuffer' }).subscribe(data => {
      const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      this.excelTemplateContent = XLSX.utils.sheet_to_html(worksheet);
      const startIndex = this.excelTemplateContent.indexOf('<title>');
      const endIndex = this.excelTemplateContent.indexOf('</title>') + '</title>'.length;
      this.excelTemplateContent = this.excelTemplateContent.slice(0, startIndex) + this.excelTemplateContent.slice(endIndex);
      console.log(this.excelTemplateContent);    
    });
  }

  downloadTemplate() {
    const isExcel = this.isExcel;
    const wordTemplateUrl = 'assets/Assessment_Template.docx';
    const excelTemplateUrl = 'assets/Assessment_Template.xlsx';
    const link = document.createElement('a');
    link.href = isExcel ? excelTemplateUrl : wordTemplateUrl;
    link.download = isExcel ? 'Assessment_Template.xlsx' : 'Assessment_Template.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.message.emit("Download Success");
  }

  async openTemplatePreview() {
    this.visibleTemplatePreview = true;

    try {
      await this.readWordFile("assets/Assessment_Template.docx");
      console.log(this.wordTemplateContent);
    } catch (error) {
      console.error('Error processing template preview:', error);
    }
  }

  private async readWordFile(filePath: string): Promise<void> {
    try {
      const arrayBuffer = await this.http.get(filePath, { responseType: 'arraybuffer' }).toPromise();
      await this.processDocxFile(arrayBuffer);
    } catch (error) {
      console.error('Error loading file:', error);
      throw error;
    }
  }

  private async processDocxFile(arrayBuffer: any): Promise<void> {
    try {
      const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
      this.wordTemplateContent = result.value;
    } catch (err) {
      console.error('Error reading .docx file:', err);
      throw err;
    }
  }

  parseQuestions(htmlContent: string): Promise<void> {
    return new Promise((resolve) => {
      console.log('Parsing HTML content:', htmlContent);
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const paragraphs = doc.querySelectorAll('p');
  
      let currentQuestion: any | null = null;
  
      paragraphs.forEach((p) => {
        const text = p.innerText.trim();
  
        if (text.startsWith('Question:')) {
          if (currentQuestion) {
            this.questions.push(currentQuestion);
          }
          currentQuestion = {
            type: 'unknown',
            content: text.replace('Question:', '').trim(),
            options: [],
            correctAnswer: [],
            score: 0
          };
        } else if (text.startsWith('Options:')) {
          currentQuestion!.type = 'mcq';
        } else if (text.startsWith('Correct Answer:')) {
          currentQuestion!.correctAnswer = [text.replace('Correct Answer:', '').trim()];
        } else if (text.startsWith('Score:')) {
          currentQuestion!.score = parseInt(text.replace('Score:', '').trim(), 10);
        } else if (currentQuestion && currentQuestion.type === 'mcq' && /^[A-Z]\./.test(text)) {
          currentQuestion.options!.push(text);
        } else if (currentQuestion && currentQuestion.type === 'unknown') {
          if (currentQuestion.content.startsWith('Fill in the blank')) {
            currentQuestion.type = 'fillup';
            currentQuestion.correctAnswer = [text.replace('____', '').trim()];
          } else {
            currentQuestion.type = 'descriptive';
            currentQuestion.correctAnswer = [text.trim()];
          }
        }
      });
  
      if (currentQuestion) {
        this.questions.push(currentQuestion);
      }
  
      console.log('Parsed questions:', this.questions);
      resolve();
    });
  }
  
  convertData(inputData: any[]): Promise<Question[]> {
    return new Promise((resolve, reject) => {
      try {
        // Extract header and data
        const headers = inputData[0];
        const data = inputData.slice(1);

        // Define the mapping for indices
        const indexMap = {
          id: 0,
          type: 1,
          content: 2,
          options: 3,
          correctAnswer: 4,
          score: 5
        };

        // Convert data to the desired format
        this.questions = data.map(row => {
          return {
            id: row[indexMap.id],
            type: row[indexMap.type],
            content: row[indexMap.content],
            options: row[indexMap.options] ? this.parseOptions(row[indexMap.options]) : [],
            correctAnswer: row[indexMap.correctAnswer] || null,
            score: row[indexMap.score]
          };
        });
        console.log(this.questions);
        resolve(this.questions);
      } catch (error) {
        reject(error);
      }
    });
  }

  private parseOptions(optionsString: string): string[] {
    // Split the options string into an array
    return optionsString.split(', ').map(option => option.split(': ')[1]);
  }
}
