import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonActiveComponent } from '../../../../ui/buttons/button-active/button-active.component';
import { ButtonInactiveComponent } from '../../../../ui/buttons/button-inactive/button-inactive.component';
import { SidebarComponent } from '../../../../components/sidebar/sidebar.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Question {
  id: string;
  type: string;
  content: string;
  options?: string[];
  correctAnswer: string[];
  score: number;
}

interface Assessment {
  id: string;
  name: string;
  scheduledBatchId: string;
  createdDate: string;
  questions: Question[];
}

@Component({
  selector: 'app-assessment-edit',
  standalone: true,
  imports: [ButtonActiveComponent, ButtonInactiveComponent, SidebarComponent, CommonModule, FormsModule],
  templateUrl: './assessment-edit.component.html',
  styleUrls: ['./assessment-edit.component.scss']
})
export class AssessmentEditComponent {
  @Input() questions: Question[] = [];
  isSidebarCollapsed: boolean = false;
  currentAssessment: Assessment | null = null;
  @Output() questionsChange: EventEmitter<Question[]> = new EventEmitter<Question[]>();

  ngOnInit() {
    
  }

  onToggleSidebar(collapsed: boolean) {
    this.isSidebarCollapsed = collapsed;
  }

  addOption(questionIndex: number) {
    const question = this.questions[questionIndex];
    if (!question.options) {
      question.options = [];
    }
    question.options.push('');
    this.questionsChange.emit(this.questions);
  }

  addQuestion() {
    this.questions.push({
      id: '',
      type: 'mcq',
      content: '',
      options: [''],
      correctAnswer: [''],
      score: 0
    });
    this.questionsChange.emit(this.questions);
  }

  setCorrectAnswer(question: Question, option: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
  
    if (isChecked) {
      if (!question.correctAnswer.includes(option)) {
        question.correctAnswer.push(option);
      }
    } else {
      const index = question.correctAnswer.indexOf(option);
      if (index > -1) {
        question.correctAnswer.splice(index, 1);
      }
    }
  
    this.questionsChange.emit(this.questions);
  }

  onQuestionsChange() {
    this.questionsChange.emit(this.questions);
  }

  trackByFn(index: number, item: any): any {
    return index;
  }

  removeOption(questionIndex: number, optionIndex: number) {
    const question = this.questions[questionIndex];
    const optionValue = question.options![optionIndex];
  
    const correctAnswerIndex = question.correctAnswer.indexOf(optionValue);
    if (correctAnswerIndex > -1) {
      question.correctAnswer.splice(correctAnswerIndex, 1);
    }
  
    question.options?.splice(optionIndex, 1);
    this.questionsChange.emit(this.questions);
  }  
}
