import { useCallback, type ChangeEvent, type Dispatch, type SetStateAction } from 'react';

/**
 * Возвращает обработчик для числового <input>, который:
 *  - преобразует значение в число
 *  - при NaN сбрасывает в 0
 *  - ограничивает диапазон [min, max]
 */
export const useClampedNumberInput = (
  setValue: Dispatch<SetStateAction<number>>,
  min = 0,
  max = 60,
) => {
  return useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      if (Number.isNaN(v)) {
        setValue(min);
        return;
      }
      setValue(Math.min(Math.max(v, min), max));
    },
    [setValue, min, max],
  );
};
