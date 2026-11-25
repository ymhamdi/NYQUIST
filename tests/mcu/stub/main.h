/* Compile-check stand-in for an STM32CubeIDE main.h: only the HAL types the
 * generated code uses. Used by CI with arm-none-eabi-gcc; a real project uses
 * its own main.h. */
#ifndef NYQ_TEST_MAIN_H
#define NYQ_TEST_MAIN_H
#include <stdint.h>
typedef struct { volatile uint32_t CR1; } TIM_TypeDef;
#define TIM2 ((TIM_TypeDef *)0x40000000UL)
typedef struct { TIM_TypeDef *Instance; } TIM_HandleTypeDef;
#endif
