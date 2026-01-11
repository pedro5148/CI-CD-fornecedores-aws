import AppErro from './../utils/appError.js'

const handleSequelizeDatabaseError = (err) => {
    const message = `Erro na operação do banco de dados: ${err.parent ? err.parent.sqlMessage : err.message}`;
    return new AppErro(message, 400);
}

const handleSequelizeUniqueConstraintError = (err) => {
    const campo = err.errors[0].path;
    const valor = err.errors[0].value;
    const message = `O valor '${valor}' já existe para o campo '${campo}'. Por favor, use outro valor.`;
    return new AppErro(message, 400);
}

const handleSequelizeValidationError = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Dados inválidos: ${errors.join('. ')}`;
    return new AppErro(message, 400);
}

// Mensagem completa de erro no NODE_ENV=development
export const sendErrorDev = (error, res) => {
    res.status(error.statusCode).json({
        status: error.status,
        error: error,
        message: error.message,
        stack: error.stack
    });
};

export const sendErrorProd = (error, res) => {
    // Erros operacionais (criados por nós ou tratados)
    if (error.isOperational) {
        res.status(error.statusCode).json({
            status: error.status,
            message: error.message
        });
    } else { 
        // Erros de programação ou desconhecidos
        console.error('ERROR 💥', error); // Log para o desenvolvedor ver no CloudWatch/Terminal
        res.status(500).json({
            status: 'error',
            message: 'Algo deu errado no servidor.'
        });
    }
}

export default (error, req, res, next) => {
    
    error.statusCode = error.statusCode || 500;
    error.status = error.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(error, res);
    } else if (process.env.NODE_ENV === 'production') {
        let err = { ...error };
        err.message = error.message;
        err.name = error.name;

        if (error.name === 'SequelizeUniqueConstraintError') {
            err = handleSequelizeUniqueConstraintError(error);
        }
        
        if (error.name === 'SequelizeValidationError') {
            err = handleSequelizeValidationError(error);
        }

        if (error.name === 'SequelizeDatabaseError') {
            err = handleSequelizeDatabaseError(error);
        }

        sendErrorProd(err, res);
    }
}