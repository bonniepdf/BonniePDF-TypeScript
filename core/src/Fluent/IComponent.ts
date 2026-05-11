import { IContentContainer } from './IContentContainer';

export interface IComponent {
  compose(container: IContentContainer): void;
}
