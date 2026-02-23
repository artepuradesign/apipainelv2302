
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cookie, Settings, BarChart, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Política de Cookies
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cookie className="h-5 w-5 text-brand-purple" />
                  1. O que são Cookies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Cookies são pequenos arquivos de texto que são armazenados no seu dispositivo 
                  quando você visita nosso site. Eles nos ajudam a melhorar sua experiência de 
                  navegação e fornecer funcionalidades personalizadas.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-brand-purple" />
                  2. Tipos de Cookies que Usamos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Cookies Essenciais</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Necessários para o funcionamento básico do site, como autenticação e preferências de sessão.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Cookies de Funcionalidade</h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      Lembram suas preferências e escolhas para melhorar sua experiência.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-brand-purple" />
                  3. Cookies de Análise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Utilizamos cookies de análise para entender como os visitantes usam nosso site. 
                  Essas informações nos ajudam a melhorar continuamente nossos serviços e a 
                  experiência do usuário.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-brand-purple" />
                  4. Gerenciamento de Cookies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600 dark:text-gray-300">
                  <p>Você pode controlar o uso de cookies:</p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Através das configurações do seu navegador</li>
                    <li>Usando nossas preferências de cookies (quando disponível)</li>
                    <li>Desabilitando cookies específicos (pode afetar funcionalidades)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botão Voltar */}
          <div className="text-center mt-8">
            <Button asChild variant="outline">
              <Link to="/">← Voltar ao Início</Link>
            </Button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default CookiePolicy;
